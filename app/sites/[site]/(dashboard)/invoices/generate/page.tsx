'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Upload, Download, AlertCircle, CheckCircle2, Loader2, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import * as XLSX from 'xlsx';

interface CsvRow {
  [key: string]: string;
}

interface GenerationStats {
  successCount: number;
  failureCount: number;
  totalRows: number;
}

export default function BulkGeneratePage() {
  const [step, setStep] = useState<'upload' | 'preview' | 'generating' | 'complete'>('upload');

  // File State
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<CsvRow[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);

  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [jobResultUrl, setJobResultUrl] = useState<string | null>(null);
  const [finalJobStats, setFinalJobStats] = useState<GenerationStats | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Standard Invoice Required Columns
  const requiredColumns = ['LOTO', 'VENDAS SB', 'A PAGAR', 'EMAIL DO FORNECEDOR'];
  const suggestedColumns = ['STAFFNAME', 'N° Bihete - NIF', 'TELEFONE DO FORNECEDOR', 'ENDEREÇO DO FORNECEDOR'];

  const downloadSample = () => {
    // We create a simple workbook and download it
    const ws = XLSX.utils.json_to_sheet([
      {
        'STAFFNAME': 'John Doe',
        'EMAIL DO FORNECEDOR': 'john@example.com',
        'TELEFONE DO FORNECEDOR': '+1 555-0198',
        'ENDEREÇO DO FORNECEDOR': '123 Main St, New York, NY 10001',
        'N° Bihete - NIF': '123456789LA04',
        'COMISSÃO BRUTA': '50000',
        'TOTAL COMISSÃO': '50000',
        'IMPOSTO': '1000',
        'TOTAL DESCONTO': '1000',
        'LOTO': '30000',
        'VENDAS SB': '20000',
        'A PAGAR': '49000'
      },
      {
        'STAFFNAME': 'Jane Smith',
        'EMAIL DO FORNECEDOR': 'jane@example.com',
        'TELEFONE DO FORNECEDOR': '+1 555-0199',
        'ENDEREÇO DO FORNECEDOR': '456 Business Ave, San Francisco, CA 94107',
        'N° Bihete - NIF': '987654321BA09',
        'COMISSÃO BRUTA': '75000',
        'TOTAL COMISSÃO': '75000',
        'IMPOSTO': '2000',
        'TOTAL DESCONTO': '2000',
        'LOTO': '45000',
        'VENDAS SB': '30000',
        'A PAGAR': '73000'
      }
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Standard_Invoice");
    XLSX.writeFile(wb, "Standard_Invoice_Template.xlsx");
  };

  const parseFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });

        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Convert the sheet to JSON (array of objects)
        const json: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

        if (json.length === 0) {
          setValidationErrors(['The uploaded file is empty']);
          return;
        }

        // Extract headers from the first row
        const headers = Object.keys(json[0]);
        setCsvHeaders(headers);

        // Sanitize string data
        const sanitizedData: CsvRow[] = json.map(row => {
          const newRow: CsvRow = {};
          for (const key of headers) {
            newRow[key] = row[key] !== null && row[key] !== undefined ? String(row[key]) : '';
          }
          return newRow;
        });

        setCsvData(sanitizedData);
        validateData(headers);
      } catch (error) {
        console.error('Error parsing file:', error);
        setValidationErrors(['Failed to parse file. Ensure it is a valid CSV or Excel file.']);
      }
    };

    reader.readAsBinaryString(file);
  };

  const validateData = (headers: string[]) => {
    const errors: string[] = [];
    const missingRequired = requiredColumns.filter(col => !headers.includes(col));

    if (missingRequired.length > 0) {
      errors.push(`❌ Missing required columns: ${missingRequired.join(', ')}`);
    }

    setValidationErrors(errors);

    if (errors.length === 0) {
      setStep('preview');
    }
  };

  const handleFileSelect = (file: File) => {
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (!['csv', 'xls', 'xlsx'].includes(fileExtension || '')) {
      setValidationErrors(['Please upload a CSV, XLS, or XLSX file']);
      return;
    }
    setExcelFile(file);
    parseFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => { setIsDragging(false); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleGenerate = async () => {
    setStep('generating');
    setGenerationProgress(0);

    try {
      // POST the parsed raw JSON instead of FormData
      const response = await fetch('/api/bulk-generation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isStandardInvoice: true,
          rows: csvData
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to start bulk generation');
      }

      const jobId = data.data?.jobId || data.jobId;

      // Poll for job status
      const pollInterval = setInterval(async () => {
        try {
          const statusResponse = await fetch(`/api/bulk-generation/${jobId}`);
          const job = await statusResponse.json();

          if (job && (job.processedRows !== undefined)) {
            const progress = job.totalRows > 0 ? Math.round((job.processedRows / job.totalRows) * 100) : 0;
            setGenerationProgress(progress);

            if (job.status === 'COMPLETED' || job.status === 'FAILED') {
              clearInterval(pollInterval);
              setStep('complete');
              if (job.resultUrl) {
                setJobResultUrl(job.resultUrl);
              }
              setFinalJobStats({
                successCount: job.successCount || 0,
                failureCount: job.failureCount || 0,
                totalRows: job.totalRows || 0,
              });
            }
          }
        } catch (error) {
          console.error('Error polling job status:', error);
        }
      }, 2000);

      setTimeout(() => clearInterval(pollInterval), 600000); // 10 min timeout

    } catch (error: any) {
      console.error('Bulk generation error:', error);
      setValidationErrors([error.message || 'Failed to generate invoices']);
      setStep('upload');
    }
  };

  const handleReset = () => {
    setStep('upload');
    setExcelFile(null);
    setCsvData([]);
    setCsvHeaders([]);
    setValidationErrors([]);
    setGenerationProgress(0);
    setJobResultUrl(null);
    setFinalJobStats(null);
  };

  const steps = [
    { id: 'upload', title: 'Upload Data' },
    { id: 'preview', title: 'Preview' },
    { id: 'generating', title: 'Generate' },
    { id: 'complete', title: 'Complete' }
  ];

  const currentStepIndex = steps.findIndex(s => s.id === step);

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6 bg-slate-50 min-h-screen">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Bulk Generate Invoices</h1>
          <p className="text-slate-600 mt-2">Upload a CSV or Excel file to generate standardized invoices in bulk.</p>
        </div>
        {step !== 'upload' && step !== 'generating' && step !== 'complete' && (
          <Button variant="outline" size="sm" onClick={handleReset}>
            Start Over
          </Button>
        )}
      </div>

      <Card className="shadow-sm border-slate-200">
        <CardHeader className="border-b bg-white">
          {/* Progress Steps */}
          <div className="relative flex items-center justify-between px-2 md:px-12 py-4">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-slate-100 -z-10" />
            <div 
              className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-blue-600 -z-10 transition-all duration-300"
              style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
            />
            
            {steps.map((s, i) => {
              const isCompleted = i < currentStepIndex;
              const isCurrent = i === currentStepIndex;
              return (
                <div key={s.id} className="flex flex-col items-center gap-2 bg-white px-4">
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-colors
                    ${isCompleted ? 'bg-blue-600 border-blue-600 text-white' : 
                      isCurrent ? 'border-blue-600 text-blue-600' : 'border-slate-200 text-slate-400 bg-white'}
                  `}>
                    {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : i + 1}
                  </div>
                  <span className={`text-xs uppercase tracking-wider font-medium hidden sm:block ${isCurrent ? 'text-blue-600' : 'text-slate-500'}`}>
                    {s.title}
                  </span>
                </div>
              );
            })}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {/* Step 1: Upload */}
          {step === 'upload' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 bg-white min-h-[400px]">
              {/* Left Column */}
              <div className="lg:col-span-1 border-r border-slate-100 p-8 space-y-6">
                <div>
                  <h4 className="font-semibold text-slate-900 mb-2">Required Columns</h4>
                  <p className="text-sm text-slate-500 mb-4">
                    Your spreadsheet must contain these columns exactly.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {requiredColumns.map((col) => (
                      <Badge key={col} variant="default" className="font-mono text-xs shadow-sm">{col} *</Badge>
                    ))}
                    {suggestedColumns.map(col => (
                      <Badge key={col} variant="outline" className="font-mono text-xs text-slate-600">{col}</Badge>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-blue-50/50 border border-blue-100/50 rounded-lg">
                  <p className="text-sm font-medium text-blue-900 mb-1">💡 Auto-Registration & Emailing</p>
                  <p className="text-xs text-blue-700 leading-relaxed">
                    If <code className="font-mono text-blue-800 bg-blue-100 px-1 py-0.5 rounded">STAFFNAME</code> matches an existing supplier, the invoice binds to them. Otherwise, a new Profile is automatically created using the <code className="font-mono text-blue-800 bg-blue-100 px-1 py-0.5 rounded">EMAIL DO FORNECEDOR</code>, <code className="font-mono text-blue-800 bg-blue-100 px-1 py-0.5 rounded">TELEFONE DO FORNECEDOR</code>, and <code className="font-mono text-blue-800 bg-blue-100 px-1 py-0.5 rounded">ENDEREÇO DO FORNECEDOR</code> columns. The invoice is immediately emailed to the supplier!
                  </p>
                </div>

                <Button variant="outline" className="w-full text-blue-600 border-blue-200 hover:bg-blue-50" onClick={downloadSample}>
                  <Download className="w-4 h-4 mr-2" />
                  Download Sample Template
                </Button>
              </div>

              {/* Right Column */}
              <div className="lg:col-span-2 p-8 flex flex-col items-center justify-center">
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`
                    w-full max-w-md border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer
                    ${isDragging ? 'border-blue-500 bg-blue-50 scale-[0.98]' : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50/50'}
                  `}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv, .xls, .xlsx"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileSelect(file);
                    }}
                  />
                  <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-blue-100">
                    <Upload className="w-8 h-8" />
                  </div>
                  <h3 className="font-semibold text-xl text-slate-900">Upload Spreadsheet</h3>
                  <p className="text-slate-500 mt-2">Drag and drop or click to browse</p>
                  <p className="text-xs text-slate-400 mt-1">Supports .xls, .xlsx, .csv</p>
                </div>

                {validationErrors.length > 0 && (
                  <Alert variant="destructive" className="mt-8 w-full max-w-md">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Validation Failed</AlertTitle>
                    <AlertDescription className="text-xs">
                      <ul className="list-disc pl-4 mt-2 space-y-1">
                        {validationErrors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Preview */}
          {step === 'preview' && (
            <div className="flex flex-col bg-white">
              <div className="p-6 border-b flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 p-2 rounded-full text-green-600">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800">Ready to Generate</h3>
                    <p className="text-sm text-slate-500">{csvData.length} valid rows found.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep('upload')}>Go Back</Button>
                  <Button onClick={handleGenerate} className="bg-blue-600 hover:bg-blue-700">
                    Generate {csvData.length} Invoices <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>

              <div className="overflow-x-auto max-h-[500px]">
                <Table>
                  <TableHeader className="bg-white sticky top-0 shadow-sm z-10">
                    <TableRow>
                      <TableHead className="w-16">Row</TableHead>
                      {csvHeaders.map((header) => (
                        <TableHead key={header} className="whitespace-nowrap">{header}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {csvData.slice(0, 50).map((row, index) => (
                      <TableRow key={index}>
                        <TableCell className="text-slate-400 font-mono text-xs">{index + 1}</TableCell>
                        {csvHeaders.map((header) => (
                          <TableCell key={header} className="whitespace-nowrap">
                            {row[header] || <span className="text-slate-300 italic">-</span>}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {csvData.length > 50 && (
                <div className="p-3 text-center text-xs text-slate-500 border-t bg-slate-50">
                  Showing first 50 of {csvData.length} rows
                </div>
              )}
            </div>
          )}

          {/* Step 3: Generating */}
          {step === 'generating' && (
            <div className="flex flex-col items-center justify-center py-24 text-center bg-white min-h-[400px]">
              <div className="relative mb-8">
                <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center">
                  <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
                </div>
                <div className="absolute top-0 left-0 w-24 h-24 rounded-full border-4 border-blue-600 border-t-transparent animate-spin ml-0 mt-0" />
              </div>
              
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Processing Invoices</h3>
              <p className="text-slate-500 mb-8 max-w-md">
                We are generating and saving your invoices in the background. Please wait.
              </p>

              <div className="w-full max-w-md px-6">
                <div className="flex justify-between text-sm font-medium mb-2 text-slate-700">
                  <span>Progress</span>
                  <span>{generationProgress}%</span>
                </div>
                <Progress value={generationProgress} className="h-3" />
                <p className="text-xs text-slate-400 mt-4 italic">
                   You can leave this page. We'll email you when it finishes.
                </p>
              </div>
            </div>
          )}

          {/* Step 4: Complete */}
          {step === 'complete' && (
            <div className="flex flex-col items-center justify-center py-20 bg-white min-h-[400px] text-center px-4">
              <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 ring-8 ${
                finalJobStats && finalJobStats.failureCount > 0 && finalJobStats.successCount === 0
                  ? 'bg-red-100 text-red-600 ring-red-50'
                  : finalJobStats && finalJobStats.failureCount > 0
                  ? 'bg-yellow-100 text-yellow-600 ring-yellow-50'
                  : 'bg-green-100 text-green-600 ring-green-50'
              }`}>
                <CheckCircle2 className="w-12 h-12" />
              </div>
              
              <h3 className="text-3xl font-bold text-slate-900 mb-2">Generation Complete!</h3>
              <p className="text-slate-500 mb-8 max-w-md">
                Successfully processed your spreadsheet. Standard invoices have been distributed.
              </p>

              {finalJobStats && (
                <div className="flex gap-4 sm:gap-8 mb-10 w-full max-w-md justify-center">
                  <div className="flex-1 flex flex-col items-center p-6 bg-green-50 rounded-2xl border border-green-100">
                    <span className="text-4xl font-black text-green-700 tracking-tight">{finalJobStats.successCount}</span>
                    <span className="text-sm font-medium text-green-800 mt-2">Generated</span>
                  </div>
                  {finalJobStats.failureCount > 0 && (
                    <div className="flex-1 flex flex-col items-center p-6 bg-red-50 rounded-2xl border border-red-100">
                      <span className="text-4xl font-black text-red-700 tracking-tight">{finalJobStats.failureCount}</span>
                      <span className="text-sm font-medium text-red-800 mt-2">Failed</span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-4">
                {jobResultUrl ? (
                  <Button size="lg" className="bg-blue-600 hover:bg-blue-700 shadow-sm" onClick={() => window.open(jobResultUrl, '_blank')}>
                    <Download className="w-5 h-5 mr-2" /> Download ZIP Archive
                  </Button>
                ) : (
                  <Button size="lg" variant="secondary" disabled>
                    Generating ZIP...
                  </Button>
                )}
                <Button variant="outline" size="lg" onClick={handleReset} className="border-slate-300">
                  Upload Another File
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
