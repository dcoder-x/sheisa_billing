'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function GenerateReportButton() {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
       const res = await fetch('/api/reports/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'FINANCIAL' })
       });

       if (!res.ok) throw new Error('Failed to generate report');

       toast.success('Report generated successfully');
       router.refresh();
    } catch (error) {
       toast.error('An error occurred');
    } finally {
       setIsGenerating(false);
    }
  };

  return (
    <Button 
      onClick={handleGenerate} 
      disabled={isGenerating}
      className="bg-blue-600 hover:bg-blue-700 text-white"
    >
      {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
      {isGenerating ? 'Generating...' : 'Generate Report'}
    </Button>
  );
}
