"use client"

import { useState, useEffect } from "react"
import { Document, Page, pdfjs } from "react-pdf"
import "react-pdf/dist/Page/AnnotationLayer.css"
import "react-pdf/dist/Page/TextLayer.css"

interface PDFViewerProps {
  url: string
  width?: number
  height?: number
  pageNumber?: number
  onLoadSuccess?: (pdf: { numPages: number; width: number; height: number }) => void
  className?: string
}

export function PDFViewer({ url, width, height, pageNumber = 1, onLoadSuccess, className }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0)
  const [pageLoaded, setPageLoaded] = useState(false)
  const [workerReady, setWorkerReady] = useState(false)

  // Configure PDF.js worker on client side only
  useEffect(() => {
    if (typeof window !== "undefined" && !pdfjs.GlobalWorkerOptions.workerSrc) {
      pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`
      setWorkerReady(true)
    } else {
      setWorkerReady(true)
    }
  }, [])

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages)
  }

  function onPageLoadSuccess(page: any) {
    if (!pageLoaded) {
      const viewport = page.getViewport({ scale: 1 })
      if (onLoadSuccess) {
        onLoadSuccess({
          numPages,
          width: viewport.width,
          height: viewport.height
        })
      }
      setPageLoaded(true)
    }
  }
  

  if (!workerReady) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Initializing PDF viewer...</div>
      </div>
    )
  }

  return (
    <Document
      file={url}
      onLoadSuccess={onDocumentLoadSuccess}
      className={`flex items-center justify-center rounded-none ${className || ''}`}
      loading={
        <div className="flex items-center justify-center p-8">
          <div className="text-muted-foreground">Loading PDF...</div>
        </div>
      }
      error={
        <div className="flex items-center justify-center p-8">
          <div className="text-destructive">Failed to load PDF</div>
        </div>
      }
    >
      <Page
        pageNumber={pageNumber}
        width={width}
        height={height}
        onLoadSuccess={onPageLoadSuccess}
        renderTextLayer={false}
        renderAnnotationLayer={false}
        className="rounded-none"
      />
    </Document>
  )
}
