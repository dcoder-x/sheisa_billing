"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Card } from "@/components/ui/card"
import type { DataField, CanvasDimensions } from "./types"
import dynamic from "next/dynamic"
import { FieldRenderer } from "./field-renderer"
const PDFViewer = dynamic(() => import("./pdf-viewer").then(mod => mod.PDFViewer), {
  ssr: false,
  loading: () => <div className="w-full h-full flex items-center justify-center bg-muted/20">Loading PDF...</div>
})

interface TemplateCanvasProps {
  type: "image" | "pdf"
  sourceUrl: string | null
  sourceWidth: number
  sourceHeight: number
  fields: DataField[]
  selectedFieldId: string | null
  onFieldSelect: (fieldId: string | null) => void
  onFieldUpdate: (fieldId: string, updates: Partial<DataField>) => void
  onFieldDelete: (fieldId: string) => void
  onCanvasDimensionsChange: (dimensions: CanvasDimensions) => void
  onPDFLoadSuccess?: (dimensions: { width: number; height: number; numPages: number }) => void
  onDropField?: (fieldType: DataField["type"], position: { x: number; y: number }) => void
  currentPage?: number
  zoom?: number
  onDuplicateField?: (fieldId: string) => void
}

export function TemplateCanvas({
  type,
  sourceUrl,
  sourceWidth,
  sourceHeight,
  fields,
  selectedFieldId,
  onFieldSelect,
  onFieldUpdate,
  onFieldDelete,
  onCanvasDimensionsChange,
  onPDFLoadSuccess,
  onDropField,
  currentPage = 1,
  zoom = 100,
  onDuplicateField,
}: TemplateCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  const [canvasWidth, setCanvasWidth] = useState(0)
  const [canvasHeight, setCanvasHeight] = useState(0)
  const [scale, setScale] = useState(1)
  const [isDragOver, setIsDragOver] = useState(false)

  // Calculate canvas dimensions to fit container while maintaining aspect ratio
  useEffect(() => {
    // Debug logging
    // console.log("TemplateCanvas: Source Dims", sourceWidth, sourceHeight, "Zoom", zoom)

    const updateDimensions = () => {
      if (!containerRef.current) return

      // For "Fit" (zoom=0), we want to fit within the visible area.
      // We rely on window dimensions to avoid issues where the parent container
      // might have expanded beyond the viewport (e.g. due to overflow issues).
      // This ensures we strictly fit the "screen height" as requested.
      
      const headerHeight = 64 // Approx header height
      const padding = 64 // 32px top/bottom padding
      const availableHeight = window.innerHeight - headerHeight - padding
      const availableWidth = window.innerWidth - (window.innerWidth >= 1024 ? 80 : 0) - padding // Subtract sidebar on desktop

      if (availableWidth <= 0 || availableHeight <= 0) return

      // console.log(`Canvas Calc: WindowH=${window.innerHeight}, AvailableH=${availableHeight}`)

      const aspectRatio = sourceWidth / sourceHeight
      
      let width = 0
      let height = 0
      
      let calculatedScale = 1

      if (zoom === 0) {
        // "Fit to Height" logic
        // We strictly use the available window height
        const heightRatio = availableHeight / sourceHeight
        
        calculatedScale = heightRatio
        
        width = sourceWidth * calculatedScale
        height = sourceHeight * calculatedScale
        
        setCanvasWidth(width)
        setCanvasHeight(height)
      } else {
        // "Zoom" logic: explicit scaling
        calculatedScale = zoom / 100
        width = sourceWidth * calculatedScale
        height = sourceHeight * calculatedScale
        
        setCanvasWidth(width)
        setCanvasHeight(height)
      }

      setScale(calculatedScale)

      onCanvasDimensionsChange({
        width: width,
        height: height,
        scale: calculatedScale
      })
    }

    // Initial check
    updateDimensions()
    
    // Listen for resize
    window.addEventListener("resize", updateDimensions)
    return () => window.removeEventListener("resize", updateDimensions)
  }, [sourceWidth, sourceHeight, onCanvasDimensionsChange, zoom])

  // Ref to track if we've measured
  const startDimensionsRef = useRef(false)
  useEffect(() => { startDimensionsRef.current = true }, [])

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only deselect if clicking directly on canvas background
    if (e.target === e.currentTarget) {
      onFieldSelect(null)
    }
  }

  const handlePDFLoad = useCallback(
    (pdfData: { numPages: number; width: number; height: number }) => {
      if (onPDFLoadSuccess) {
        onPDFLoadSuccess(pdfData)
      }
    },
    [onPDFLoadSuccess]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    const fieldType = e.dataTransfer.getData("fieldType") as DataField["type"]
    if (!fieldType || !canvasRef.current || !onDropField) return

    // Get canvas bounds
    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Convert to percentage
    const xPercent = (x / canvasWidth) * 100
    const yPercent = (y / canvasHeight) * 100

    // Call the drop handler with field type and position
    onDropField(fieldType, { x: xPercent, y: yPercent })
  }, [canvasWidth, canvasHeight, onDropField])

  if (!sourceUrl) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center space-y-2">
          <p className="text-muted-foreground">Upload a file to get started</p>
          <p className="text-xs text-muted-foreground hidden md:block">Drag and drop fields from the sidebar</p>
          <p className="text-xs text-muted-foreground md:hidden">Use the toolbar below to add fields</p>
        </div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="min-w-full min-h-full flex items-center justify-center p-8">
      <Card 
        ref={canvasRef}
        className={`relative bg-white shadow-2xl overflow-hidden cursor-default rounded-none transition-all max-w-none max-h-none ${
          isDragOver ? "ring-4 ring-primary ring-opacity-50" : ""
        }`}
        style={{ width: canvasWidth, height: canvasHeight }}
        onClick={handleCanvasClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Drag Over Overlay */}
        {isDragOver && (
          <div className="absolute lg:hidden inset-0 bg-primary/10 z-50 flex items-center justify-center pointer-events-none">
            <div className="bg-white rounded-lg px-6 py-4 shadow-lg border-2 border-primary border-dashed">
              <p className="text-primary font-medium">Drop field here</p>
            </div>
          </div>
        )}
        {/* Background Image/PDF */}
        {type === "image" ? (
          <img
            src={sourceUrl}
            alt="Template"
            className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none"
            draggable={false}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <PDFViewer
              url={sourceUrl}
              width={canvasWidth}
              height={canvasHeight}
              pageNumber={currentPage}
              onLoadSuccess={handlePDFLoad}
            />
          </div>
        )}

        {/* Fields Layer */}
        <div className="absolute inset-0">
          {fields
            .filter(field => (field.page || 1) === currentPage)
            .map((field) => (
            <FieldRenderer
              key={field.id}
              field={field}
              canvasWidth={canvasWidth}
              canvasHeight={canvasHeight}
              isSelected={field.id === selectedFieldId}
              onSelect={() => onFieldSelect(field.id)}
              onUpdate={(updates) => onFieldUpdate(field.id, updates)}
              onDelete={() => onFieldDelete(field.id)}
              onDuplicate={() => onDuplicateField?.(field.id)}
              scale={scale}
            />
          ))}
        </div>

        {/* Grid Overlay (optional) */}
        {selectedFieldId && (
          <div className="absolute inset-0 pointer-events-none opacity-10">
            <svg width="100%" height="100%">
              <defs>
                <pattern
                  id="grid"
                  width="20"
                  height="20"
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d="M 20 0 L 0 0 0 20"
                    fill="none"
                    stroke="gray"
                    strokeWidth="0.5"
                  />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>
        )}
      </Card>
    </div>
  )
}
