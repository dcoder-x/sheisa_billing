'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils'; // Assuming utils exists

interface FileUploaderProps {
  value?: string;
  onChange?: (url: string) => void;
  onFileSelect?: (file: File) => void;
  className?: string;
  accept?: string;
  maxSizeMB?: number; // MB
}

export function FileUploader({ 
  value, 
  onChange, 
  onFileSelect,
  className, 
  accept = "image/*", 
  maxSizeMB = 5 
}: FileUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File size must be less than ${maxSizeMB}MB`);
      return;
    }

    setError(null);

    // If onFileSelect is provided, delegate handling to parent (deferred upload)
    if (onFileSelect) {
      onFileSelect(file);
      // Reset input manually so same file can be selected again if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    // Otherwise, perform immediate upload
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Upload failed');
      }

      const data = await res.json();
      if (onChange) onChange(data.url);
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload file');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = ''; // Reset input
      }
    }
  };

  const handleRemove = () => {
    if (onChange) onChange('');
    if (onFileSelect) {
       // We can't really "unselect" a file in the parent via this callback cleanly 
       // unless we pass null, but the type expects File.
       // Usually parent checks 'value' prop. 
       // If using deferred mode, parent might need a way to clear the file.
       // PROPOSAL: Allow onFileSelect to take null? Or just rely on parent handling onChange('') if they sync valid/preview.
       // Let's assume parent clears file when value becomes empty via onChange.
    }
    setError(null);
  };

  return (
    <div className={cn("space-y-3", className)}>
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept={accept}
        onChange={handleFileSelect}
      />

      {value ? (
        <div className="relative w-full max-w-xs aspect-video bg-slate-100 rounded-md overflow-hidden border border-slate-200 group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={value} 
            alt="Uploaded Preview" 
            className="w-full h-full object-contain p-2" 
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={handleRemove}
              type="button"
            >
              <X className="w-4 h-4 mr-2" />
              Remove
            </Button>
          </div>
        </div>
      ) : (
        <div 
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "border-2 border-dashed border-slate-300 rounded-md p-6 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors",
            isUploading && "pointer-events-none opacity-70",
            error && "border-red-300 bg-red-50"
          )}
        >
          {isUploading ? (
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-2" />
          ) : (
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mb-2">
              <Upload className="w-5 h-5 text-blue-600" />
            </div>
          )}
          
          <div className="text-center">
            <p className="text-sm font-medium text-slate-700">
              {isUploading ? 'Uploading...' : 'Click to upload'}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {isUploading ? 'Please wait' : `SVG, PNG, JPG (max ${maxSizeMB}MB)`}
            </p>
          </div>
        </div>
      )}

      {error && (
        <p className="text-xs text-red-600 font-medium">{error}</p>
      )}
    </div>
  );
}
