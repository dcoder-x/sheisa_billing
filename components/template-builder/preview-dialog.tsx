"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import type { DataField } from "./types"
import { useState } from "react"

interface PreviewDialogProps {
  open: boolean
  onClose: () => void
  sourceUrl: string
  sourceWidth: number
  sourceHeight: number
  fields: DataField[]
  type?: "image" | "pdf"
}

export function PreviewDialog({
  open,
  onClose,
  sourceUrl,
  sourceWidth,
  sourceHeight,
  fields,
  type = "image"
}: PreviewDialogProps) {
  const [pdfError, setPdfError] = useState(false)
  
  const isPDF = type === "pdf" || sourceUrl.toLowerCase().endsWith('.pdf')
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Template Preview</DialogTitle>
            {/* <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button> */}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto bg-muted/10 p-4 flex items-center justify-center">
          <div className="relative inline-block bg-white shadow-2xl">
            {isPDF ? (
              <div className="relative inline-block">
                <iframe
                  src={sourceUrl}
                  className="block"
                  style={{ 
                    width: `${sourceWidth}px`,
                    height: `${sourceHeight}px`,
                    maxHeight: '85vh',
                    maxWidth: '100%',
                    border: 'none'
                  }}
                  title="PDF Preview"
                  onError={() => setPdfError(true)}
                />
                
                {/* Render fields as overlays on PDF */}
                {fields.map((field) => (
                  <div
                    key={field.id}
                    className="absolute border-2 border-dashed border-primary/30 bg-primary/5 flex items-center justify-center pointer-events-none"
                    style={{
                      left: `${field.x}%`,
                      top: `${field.y}%`,
                      width: `${field.width}%`,
                      height: `${field.height}%`,
                      fontSize: field.fontSize ? `${field.fontSize}px` : '14px',
                      fontFamily: field.fontFamily || 'inherit',
                      fontWeight: field.fontWeight || 'normal',
                      color: field.textColor || '#666'
                    }}
                  >
                    <span className="text-xs px-2 truncate">
                      {field.label}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="relative inline-block">
                <img
                  src={sourceUrl}
                  alt="Template Preview"
                  className="block w-auto h-auto"
                  style={{ maxHeight: "85vh", maxWidth: "100%" }}
                />
                
                {/* Render fields as overlays */}
                {fields.map((field) => (
                  <div
                    key={field.id}
                    className="absolute border-2 border-dashed border-primary/30 bg-primary/5 flex items-center justify-center pointer-events-none"
                    style={{
                      left: `${field.x}%`,
                      top: `${field.y}%`,
                      width: `${field.width}%`,
                      height: `${field.height}%`,
                      fontSize: field.fontSize ? `${field.fontSize}px` : '14px',
                      fontFamily: field.fontFamily || 'inherit',
                      fontWeight: field.fontWeight || 'normal',
                      color: field.textColor || '#666'
                    }}
                  >
                    <span className="text-xs px-2 truncate">
                      {field.label}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
