'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2, Upload, AlertCircle, FileText, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface Template {
  id: string;
  name: string;
}

interface CsvRow {
  SupplierName: string;
  Email: string;
  Amount: string;
  Description: string;
  DueDate?: string; 
}

export default function BulkGeneratePage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<CsvRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [generatedCount, setGeneratedCount] = useState(0);

  useEffect(() => {
    fetch('/api/templates')
      .then((res) => res.json())
      .then((data) => setTemplates(data))
      .catch((err) => console.error('Failed to load templates', err));
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCsvFile(e.target.files[0]);
      setIsSuccess(false);
      parseCsv(e.target.files[0]);
    }
  };

  const parseCsv = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n');
      const headers = lines[0].split(',').map((h) => h.trim());
      
      const rows = [];
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const values = lines[i].split(',').map((v) => v.trim());
        const row: any = {};
        headers.forEach((header, index) => {
          row[header] = values[index];
        });
        rows.push(row);
      }
      setParsedData(rows);
    };
    reader.readAsText(file);
  };

  const handleGenerate = async () => {
    if (!selectedTemplate || parsedData.length === 0) {
      toast.error('Please select a template and upload a valid CSV');
      return;
    }

    setIsProcessing(true);
    try {
      const res = await fetch('/api/invoices/bulk-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: selectedTemplate,
          csvData: parsedData,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to generate invoices');
      }

      const result = await res.json();
      setGeneratedCount(result.count);
      setIsSuccess(true);
      toast.success(`Successfully generated ${result.count} invoices!`);
      
      // Reset form
      setCsvFile(null);
      setParsedData([]);
      setSelectedTemplate('');
       // Reset file input value
      const fileInput = document.getElementById('csv-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

    } catch (error) {
      console.error('Generation error:', error);
      toast.error('Failed to generate invoices');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Bulk Invoice Generation</h1>
        <p className="text-slate-600 mt-2">Generate multiple invoices at once using a CSV file</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Configuration */}
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>1. Select Template</Label>
                <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>2. Upload CSV</Label>
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:bg-slate-50 transition-colors cursor-pointer relative">
                  <input
                    id="csv-upload"
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-600">
                    {csvFile ? csvFile.name : 'Click to upload CSV'}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Headers: SupplierName, Email, Amount, Description
                  </p>
                </div>
              </div>

              <Button 
                onClick={handleGenerate} 
                disabled={!selectedTemplate || parsedData.length === 0 || isProcessing}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  'Generate Invoices'
                )}
              </Button>
            </CardContent>
          </Card>

          {isSuccess && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800">Success!</AlertTitle>
              <AlertDescription className="text-green-700">
                Generated and sent {generatedCount} invoices.
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Right Column: Preview */}
        <div className="md:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Data Preview</CardTitle>
              <CardDescription>
                Review the data before generating invoices.
                {parsedData.length > 0 && ` Found ${parsedData.length} rows.`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {parsedData.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                  <FileText className="w-12 h-12 mb-4 opacity-50" />
                  <p>Upload a CSV file to preview data</p>
                </div>
              ) : (
                <div className="overflow-auto max-h-[500px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {Object.keys(parsedData[0]).map((header) => (
                          <TableHead key={header}>{header}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedData.map((row, i) => (
                        <TableRow key={i}>
                          {Object.values(row).map((cell: any, j) => (
                            <TableCell key={j}>{cell}</TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
