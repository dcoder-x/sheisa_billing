"use client"

import { useState, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Upload, Download, AlertCircle, CheckCircle2, Loader2, ChevronRight } from 'lucide-react'
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

interface TemplateGenerateModalProps {
  open: boolean
  onClose: () => void
  templateId: string
  templateName: string
  placeholders: Array<{ 
    id: string
    type: string
    properties: { 
      label: string
      required: boolean
      [key: string]: any 
    }
  }>
  onGenerate?: (results: any) => void
}

interface CsvRow {
  [key: string]: string
}

interface GenerationResult {
  row: number
  success: boolean
  documentUrl?: string
  error?: string
}

export function TemplateGenerateModal({ 
  open, 
  onClose, 
  templateId,
  templateName,
  placeholders,
  onGenerate 
}: TemplateGenerateModalProps) {
  const [step, setStep] = useState<'upload-csv' | 'preview' | 'generating' | 'complete'>('upload-csv')
  
  // CSV State
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [csvData, setCsvData] = useState<CsvRow[]>([])
  const [csvHeaders, setCsvHeaders] = useState<string[]>([])
  
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [generationProgress, setGenerationProgress] = useState(0)
  const [results, setResults] = useState<GenerationResult[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [jobResultUrl, setJobResultUrl] = useState<string | null>(null)
  const [finalJobStats, setFinalJobStats] = useState<{ successCount: number; failureCount: number; totalRows: number } | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Normalize placeholders - DataField objects have label/required at top-level,
  // but may also be in nested properties for other usages. Support both.
  const normalizedPlaceholders = placeholders?.map(p => ({
    id: p.id,
    name: (p as any).label || p.properties?.label || p.id,
    type: p.type,
    required: (p as any).required ?? p.properties?.required ?? false,
    columns: (p as any).columns as Array<{ key: string; header: string }> | undefined,
  }))

  // Minimal RFC-4180-compliant CSV cell quoting
  const quoteCsvCell = (value: string): string => {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`
    }
    return value
  }

  // Generate sample CSV template
  const generateSampleCSV = () => {
    // supplier_name is always the first column — it's a special system column
    const supplierHeader = 'supplier_name'
    const supplierSample = 'Global Supplies Ltd'

    const fieldHeaders = normalizedPlaceholders.map(p => quoteCsvCell(p.name))
    const fieldSamples = normalizedPlaceholders.map(p => {
      switch (p.type) {
        case 'text': return p.name.toLowerCase().includes('name') ? 'John Doe' : 
                           p.name.toLowerCase().includes('email') ? 'john@example.com' :
                           p.name.toLowerCase().includes('phone') ? '+1234567890' :
                           'Sample Text'
        case 'image': return 'https://example.com/image1.jpg'
        case 'checkbox': return 'true'
        case 'signature': return 'https://example.com/signature1.png'
        case 'date': return new Date().toISOString().split('T')[0]
        case 'table': {
          const cols = p.columns
          if (cols && cols.length > 0) {
            const sampleRow = Object.fromEntries(cols.map(col => [col.key, `sample_${col.key}`]))
            return quoteCsvCell(JSON.stringify([sampleRow, sampleRow]))
          }
          return quoteCsvCell('[{"item":"Sample Item","qty":"1","price":"100.00"}]')
        }
        default: return 'sample_value'
      }
    })

    const headers = [supplierHeader, ...fieldHeaders].join(',')
    const sampleRow = [supplierSample, ...fieldSamples].join(',')
    return `${headers}\n${sampleRow}`
  }

  // Download sample CSV
  const downloadSample = () => {
    const csv = generateSampleCSV()
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${templateName}-template.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // RFC-4180 compliant CSV parser that handles quoted fields (including JSON arrays)
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = []
    let current = ''
    let inQuotes = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') { current += '"'; i++ } // escaped quote
        else { inQuotes = !inQuotes }
      } else if (ch === ',' && !inQuotes) {
        result.push(current.trim())
        current = ''
      } else {
        current += ch
      }
    }
    result.push(current.trim())
    return result
  }

  // Parse CSV file
  const parseCSV = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const lines = text.split('\n').filter(line => line.trim())
      
      if (lines.length === 0) {
        setValidationErrors(['CSV file is empty'])
        return
      }

      const headers = parseCSVLine(lines[0])
      const data: CsvRow[] = []

      for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i])
        const row: CsvRow = {}
        headers.forEach((header, index) => {
          row[header] = values[index] || ''
        })
        data.push(row)
      }

      setCsvHeaders(headers)
      setCsvData(data)
      validateCSV(headers, data)
    }
    reader.readAsText(file)
  }

  // Validate CSV data
  const validateCSV = (headers: string[], data: CsvRow[]) => {
    const errors: string[] = []

    const requiredFields = normalizedPlaceholders.filter(p => p.required).map(p => p.name)
    const missingRequired = requiredFields.filter(field => !headers.includes(field))
    
    if (missingRequired.length > 0) {
      errors.push(`❌ Missing required template fields: ${missingRequired.join(', ')}`)
    }

    setValidationErrors(errors)

    if (errors.length === 0) {
      setStep('preview')
    }
  }

  // Handle file selection
  const handleFileSelect = (file: File) => {
    if (!file.name.endsWith('.csv')) {
      setValidationErrors(['Please upload a CSV file'])
      return
    }
    setCsvFile(file)
    parseCSV(file)
  }

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true) }
  const handleDragLeave = () => { setIsDragging(false) }
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelect(file)
  }

  // Generate documents
  const handleGenerate = async () => {
    setStep('generating')
    setResults([])
    setGenerationProgress(0)

    try {
      const formData = new FormData()
      formData.append('templateId', templateId)
      
      if (!csvFile) throw new Error('No CSV file selected')
      formData.append('csv', csvFile)

      const response = await fetch('/api/bulk-generation', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start bulk generation')
      }

      const jobId = data.data.jobId
      
      // Poll for job status
      const pollInterval = setInterval(async () => {
        try {
          const statusResponse = await fetch(`/api/bulk-generation/${jobId}`)
          const job = await statusResponse.json()
          
          if (job && (job.processedRows !== undefined)) {
            const progress = job.totalRows > 0 ? Math.round((job.processedRows / job.totalRows) * 100) : 0
            setGenerationProgress(progress)

            if (job.status === 'COMPLETED' || job.status === 'FAILED') {
              clearInterval(pollInterval)
              setStep('complete')
              if (job.resultUrl) {
                setJobResultUrl(job.resultUrl)
              }
              setFinalJobStats({
                successCount: job.successCount ?? 0,
                failureCount: job.failureCount ?? 0,
                totalRows: job.totalRows ?? 0,
              })
              onGenerate?.([])
            }
          }
        } catch (error) {
          console.error('Error polling job status:', error)
        }
      }, 2000)

      setTimeout(() => clearInterval(pollInterval), 600000) // 10 min timeout
    } catch (error: any) {
      console.error('Bulk generation error:', error)
      setValidationErrors([error.message || 'Failed to generate documents'])
      setStep('upload-csv')
    }
  }

  // Reset modal
  const handleReset = () => {
    setStep('upload-csv')
    setCsvFile(null)
    setCsvData([])
    setCsvHeaders([])
    setValidationErrors([])
    setGenerationProgress(0)
    setResults([])
    setJobResultUrl(null)
    setFinalJobStats(null)
  }

  const steps = [
    { id: 'upload-csv', title: 'Upload CSV' },
    { id: 'preview', title: 'Preview' },
    { id: 'generating', title: 'Generate' },
    { id: 'complete', title: 'Complete' }
  ]

  const currentStepIndex = steps.findIndex(s => s.id === step)

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl p-0 h-[80vh] flex flex-col overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b bg-muted/40 shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div>
              <DialogTitle className="text-xl">Bulk Generation</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Generate multiple documents from {templateName}
              </p>
            </div>
            {step !== 'upload-csv' && step !== 'generating' && step !== 'complete' && (
              <Button variant="ghost" size="sm" onClick={handleReset}>
                Start Over
              </Button>
            )}
          </div>

          {/* Progress Steps */}
          <div className="relative flex items-center justify-between px-2">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-muted -z-10" />
            <div 
              className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-primary -z-10 transition-all duration-300"
              style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
            />
            
            {steps.map((s, i) => {
              const isCompleted = i < currentStepIndex
              const isCurrent = i === currentStepIndex
              return (
                <div key={s.id} className="flex flex-col items-center gap-2 bg-background px-2">
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-colors
                    ${isCompleted ? 'bg-primary border-primary text-primary-foreground' : 
                      isCurrent ? 'border-primary text-primary' : 'border-muted text-muted-foreground bg-background'}
                  `}>
                    {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                  </div>
                  <span className={`text-[10px] uppercase tracking-wider font-medium ${isCurrent ? 'text-primary' : 'text-muted-foreground'}`}>
                    {s.title}
                  </span>
                </div>
              )
            })}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto bg-slate-50/50">

          {/* Step 1: Upload CSV */}
          {step === 'upload-csv' && (
            <div className="max-w-3xl mx-auto p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                {/* Left: Required Columns + Download + Info */}
                <div className="md:col-span-1 space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Required Columns</h4>
                    <p className="text-xs text-muted-foreground mb-4">
                      Your CSV must contain these headers exactly (case-sensitive).
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {normalizedPlaceholders.map((field) => (
                        <Badge 
                          key={field.name} 
                          variant={field.required ? "default" : "outline"}
                          className="font-mono text-xs"
                        >
                          {field.name}
                          {field.required && "*"}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <Button variant="outline" size="sm" className="w-full" onClick={downloadSample}>
                    <Download className="w-4 h-4 mr-2" />
                    Download Sample CSV
                  </Button>

                  {/* Supplier column tip */}
                  <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
                    <p className="text-xs font-semibold text-blue-800 mb-1">💡 Supplier Column (optional)</p>
                    <p className="text-xs text-blue-700">
                      Add a <code className="bg-blue-100 px-1 rounded font-mono">supplier_name</code> column to link each row to a supplier. If the supplier exists in your account, they will automatically receive a copy of their invoice by email.
                    </p>
                  </div>
                </div>

                {/* Right: Upload Panel */}
                <div className="md:col-span-2 space-y-6">
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`
                      border-2 border-dashed rounded-xl p-10 text-center transition-all
                      ${isDragging ? 'border-primary bg-primary/5 scale-[0.99]' : 'border-slate-200 hover:border-primary/50 hover:bg-slate-50'}
                      cursor-pointer
                    `}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleFileSelect(file)
                      }}
                    />
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-500">
                      <Upload className="w-8 h-8" />
                    </div>
                    <h3 className="font-semibold text-lg">Click to upload CSV</h3>
                    <p className="text-sm text-muted-foreground mt-1">or drag and drop here</p>
                  </div>

                  {validationErrors.length > 0 && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="font-semibold mb-1">Validation Failed</div>
                        <ul className="list-disc pl-4 space-y-1 text-xs">
                          {validationErrors.map((error, index) => (
                            <li key={index}>{error}</li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step: Preview */}
          {step === 'preview' && (
            <div className="h-full flex flex-col p-6">
              <div className="flex items-center justify-between mb-4">
                <Alert className="bg-green-50 border-green-200 text-green-800 w-auto">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription>
                    Data validated successfully. Ready to generate <strong>{csvData.length}</strong> documents.
                  </AlertDescription>
                </Alert>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={() => setStep('upload-csv')}>Back to Upload</Button>
                  <Button onClick={handleGenerate}>
                    Generate All <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>

              <div className="flex-1 border rounded-lg overflow-hidden bg-white shadow-sm flex flex-col">
                <div className="p-3 border-b bg-slate-50 flex items-center justify-between text-xs font-medium text-muted-foreground">
                  <span>Data Preview (First 50 rows)</span>
                  <span>{csvData.length} Total Rows</span>
                </div>
                <div className="flex-1 overflow-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b sticky top-0 z-10">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-slate-700 w-16">#</th>
                        {csvHeaders.map((header) => (
                          <th key={header} className="px-4 py-3 text-left font-semibold text-slate-700">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {csvData.slice(0, 50).map((row, index) => (
                        <tr key={index} className="hover:bg-slate-50/50">
                          <td className="px-4 py-3 text-slate-500 font-mono text-xs">{index + 1}</td>
                          {csvHeaders.map((header) => (
                            <td key={header} className="px-4 py-3">
                              {row[header] ? (
                                <span className="text-slate-900">{row[header]}</span>
                              ) : (
                                <span className="text-slate-300 italic">Empty</span>
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Step: Generating */}
          {step === 'generating' && (
            <div className="h-full flex flex-col items-center justify-center p-12 text-center max-w-lg mx-auto">
              <div className="relative mb-8">
                <div className="w-24 h-24 rounded-full border-4 border-slate-100 flex items-center justify-center">
                  <Loader2 className="w-10 h-10 animate-spin text-primary" />
                </div>
                <div className="absolute top-0 left-0 w-24 h-24 rounded-full border-4 border-primary border-t-transparent animate-spin ml-0 mt-0" />
              </div>
              
              <h3 className="text-2xl font-bold mb-2">Generating Documents</h3>
              <p className="text-muted-foreground mb-8">
                Please wait while we process {csvData.length || 'your'} documents. This may take a few moments.
              </p>

              <div className="w-full space-y-2">
                <div className="flex justify-between text-sm font-medium">
                  <span>Progress</span>
                  <span>{generationProgress}%</span>
                </div>
                <Progress value={generationProgress} className="h-3" />
              </div>
              
              {generationProgress < 100 && (
                <p className="text-xs text-muted-foreground mt-4 italic">
                  Tip: You can safely run this in the background. We'll verify everything for you.
                </p>
              )}
            </div>
          )}

          {/* Step: Complete */}
          {step === 'complete' && (
            <div className="h-full flex flex-col items-center justify-center p-8 max-w-2xl mx-auto text-center">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 ${
                finalJobStats && finalJobStats.failureCount > 0 && finalJobStats.successCount === 0
                  ? 'bg-red-100 text-red-600'
                  : finalJobStats && finalJobStats.failureCount > 0
                  ? 'bg-yellow-100 text-yellow-600'
                  : 'bg-green-100 text-green-600'
              }`}>
                <CheckCircle2 className="w-10 h-10" />
              </div>
              
              <h3 className="text-3xl font-bold mb-2">Generation Complete!</h3>
              <p className="text-muted-foreground mb-6 text-lg">
                {finalJobStats
                  ? `Processed ${finalJobStats.totalRows} document${finalJobStats.totalRows !== 1 ? 's' : ''}.`
                  : 'Your documents have been processed.'}
              </p>

              {/* Success / Failure Stats */}
              {finalJobStats && (
                <div className="flex gap-6 mb-8">
                  <div className="flex flex-col items-center p-4 bg-green-50 rounded-xl border border-green-100 min-w-[100px]">
                    <span className="text-3xl font-bold text-green-600">{finalJobStats.successCount}</span>
                    <span className="text-sm text-green-700 mt-1">✓ Succeeded</span>
                  </div>
                  {finalJobStats.failureCount > 0 && (
                    <div className="flex flex-col items-center p-4 bg-red-50 rounded-xl border border-red-100 min-w-[100px]">
                      <span className="text-3xl font-bold text-red-600">{finalJobStats.failureCount}</span>
                      <span className="text-sm text-red-700 mt-1">✗ Failed</span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3 mb-8">
                {jobResultUrl && (
                  <Button size="lg" onClick={() => window.open(jobResultUrl, '_blank')}>
                    <Download className="w-4 h-4 mr-2" /> Download Zip
                  </Button>
                )}
                {!jobResultUrl && (
                  <p className="text-yellow-600 text-sm">Download link not available. Check your dashboard later.</p>
                )}
                <Button variant="outline" size="lg" onClick={handleReset}>Generate Another</Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
