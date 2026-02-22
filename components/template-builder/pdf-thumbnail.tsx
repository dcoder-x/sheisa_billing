"use client"

import { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Loader2 } from 'lucide-react';

// Configure PDF worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PdfThumbnailProps {
    url: string;
    width?: number;
    className?: string;
}

export function PdfThumbnail({ url, width = 300, className }: PdfThumbnailProps) {
    const [numPages, setNumPages] = useState<number>();
    const [loading, setLoading] = useState(true);

    function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
        setNumPages(numPages);
        setLoading(false);
    }

    return (
        <div className={`relative overflow-hidden bg-slate-100 flex items-center justify-center ${className}`}>
             {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-50 z-10 transition-opacity duration-300">
                    <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                </div>
            )}
            <Document
                file={url}
                onLoadSuccess={onDocumentLoadSuccess}
                loading={
                    <div className="flex items-center justify-center h-full w-full">
                        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                    </div>
                }
                error={
                    <div className="flex items-center justify-center h-full w-full text-xs text-red-400 p-2 text-center">
                        Failed to load PDF
                    </div>
                }
                className="flex justify-center"
            >
                <Page 
                    pageNumber={1} 
                    width={width} 
                    renderTextLayer={false} 
                    renderAnnotationLayer={false}
                    className="shadow-sm" 
                />
            </Document>
           
            <style jsx global>{`
                .react-pdf__Page__canvas {
                    display: block;
                    user-select: none;
                }
            `}</style>
        </div>
    );
}
