"use client"

import { useRef, useState, useEffect, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trash2, GripVertical, Image as ImageIcon, Type, CheckSquare, Calendar, Signature, RotateCw, Copy, Table as TableIcon } from "lucide-react"
import type { DataField } from "./types"

interface FieldRendererProps {
  field: DataField
  canvasWidth: number
  canvasHeight: number
  isSelected: boolean
  onSelect: () => void
  onUpdate: (updates: Partial<DataField>) => void
  onDelete: () => void
  onDuplicate?: () => void
  scale?: number
}

type ResizeDirection = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | null

export function FieldRenderer({
  field,
  canvasWidth,
  canvasHeight,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  onDuplicate,
  scale = 1
}: FieldRendererProps) {
  const fieldRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isRotating, setIsRotating] = useState(false)
  const [resizeDirection, setResizeDirection] = useState<ResizeDirection>(null)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [initialBounds, setInitialBounds] = useState({ x: 0, y: 0, width: 0, height: 0 })
  const [rotationStart, setRotationStart] = useState({ x: 0, y: 0, initialRotation: 0 })

  const currentUnit = field.unit || "percent"

  // Convert to pixels based on unit type AND scale
  const pixelX = (currentUnit === "percent" ? (field.x / 100) * canvasWidth : field.x)
  const pixelY = (currentUnit === "percent" ? (field.y / 100) * canvasHeight : field.y)
  const pixelWidth = (currentUnit === "percent" ? (field.width / 100) * canvasWidth : field.width)
  const pixelHeight = (currentUnit === "percent" ? (field.height / 100) * canvasHeight : field.height)

  // Handle dragging with mouse
  const handleMouseDown = (e: React.MouseEvent) => {
    if (resizeDirection) return
    if ((e.target as HTMLElement).classList.contains("rotation-handle")) return
    e.stopPropagation()
    onSelect()
    setIsDragging(true)
    setDragStart({ x: e.clientX, y: e.clientY })
    setInitialBounds({ x: pixelX, y: pixelY, width: pixelWidth, height: pixelHeight })
  }

  // Handle dragging with touch
  const handleTouchStart = (e: React.TouchEvent) => {
    if (resizeDirection) return
    if ((e.target as HTMLElement).classList.contains("rotation-handle")) return
    e.stopPropagation()
    onSelect()
    const touch = e.touches[0]
    setIsDragging(true)
    setDragStart({ x: touch.clientX, y: touch.clientY })
    setInitialBounds({ x: pixelX, y: pixelY, width: pixelWidth, height: pixelHeight })
  }

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isRotating && fieldRef.current) {
      // Calculate rotation based on mouse position relative to field center
      const rect = fieldRef.current.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2
      
      const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX)
      const initialAngle = Math.atan2(rotationStart.y, rotationStart.x)
      const rotation = (rotationStart.initialRotation + (angle - initialAngle) * (180 / Math.PI)) % 360
      
      onUpdate({ rotation: Math.round(rotation) })
    } else if (isDragging) {
      const deltaX = e.clientX - dragStart.x
      const deltaY = e.clientY - dragStart.y
      
      const newX = Math.max(0, Math.min(initialBounds.x + deltaX, canvasWidth - pixelWidth))
      const newY = Math.max(0, Math.min(initialBounds.y + deltaY, canvasHeight - pixelHeight))
      
      const updates = currentUnit === "percent"
        ? {
            x: (newX / canvasWidth) * 100,
            y: (newY / canvasHeight) * 100
          }
        : {
            x: newX,
            y: newY
          }
      
      onUpdate(updates)
    } else if (resizeDirection) {
      const deltaX = e.clientX - dragStart.x
      const deltaY = e.clientY - dragStart.y
      
      let newX = initialBounds.x
      let newY = initialBounds.y
      let newWidth = initialBounds.width
      let newHeight = initialBounds.height
      
      // Handle horizontal resize
      if (resizeDirection.includes('w')) {
        newX = Math.max(0, Math.min(initialBounds.x + deltaX, initialBounds.x + initialBounds.width - 20))
        newWidth = initialBounds.width - (newX - initialBounds.x)
      } else if (resizeDirection.includes('e')) {
        newWidth = Math.max(20, Math.min(initialBounds.width + deltaX, canvasWidth - initialBounds.x))
      }
      
      // Handle vertical resize
      if (resizeDirection.includes('n')) {
        newY = Math.max(0, Math.min(initialBounds.y + deltaY, initialBounds.y + initialBounds.height - 20))
        newHeight = initialBounds.height - (newY - initialBounds.y)
      } else if (resizeDirection.includes('s')) {
        newHeight = Math.max(20, Math.min(initialBounds.height + deltaY, canvasHeight - initialBounds.y))
      }

      const updates = currentUnit === "percent"
        ? {
            x: (newX / canvasWidth) * 100,
            y: (newY / canvasHeight) * 100,
            width: (newWidth / canvasWidth) * 100,
            height: (newHeight / canvasHeight) * 100
          }
        : {
            x: newX,
            y: newY,
            width: newWidth,
            height: newHeight
          }
      
      onUpdate(updates)
    }
  }, [isDragging, resizeDirection, isRotating, dragStart, initialBounds, canvasWidth, canvasHeight, pixelWidth, pixelHeight, currentUnit, onUpdate, field.rotation, rotationStart])

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging && !resizeDirection) return
    const touch = e.touches[0]
    
    if (isDragging) {
      const deltaX = touch.clientX - dragStart.x
      const deltaY = touch.clientY - dragStart.y
      
      const newX = Math.max(0, Math.min(initialBounds.x + deltaX, canvasWidth - pixelWidth))
      const newY = Math.max(0, Math.min(initialBounds.y + deltaY, canvasHeight - pixelHeight))
      
      const updates = currentUnit === "percent"
        ? {
            x: (newX / canvasWidth) * 100,
            y: (newY / canvasHeight) * 100
          }
        : {
            x: newX,
            y: newY
          }
      
      onUpdate(updates)
    }
  }, [isDragging, resizeDirection, dragStart, initialBounds, canvasWidth, canvasHeight, pixelWidth, pixelHeight, currentUnit, onUpdate])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    setIsRotating(false)
    setResizeDirection(null)
  }, [])

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false)
    setResizeDirection(null)
  }, [])

  useEffect(() => {
    if (isDragging || resizeDirection || isRotating) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
      document.addEventListener("touchmove", handleTouchMove)
      document.addEventListener("touchend", handleTouchEnd)
      return () => {
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
        document.removeEventListener("touchmove", handleTouchMove)
        document.removeEventListener("touchend", handleTouchEnd)
      }
    }
  }, [isDragging, resizeDirection, isRotating, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd])

  // Handle resize start
  const handleResizeStart = (direction: ResizeDirection) => (e: React.MouseEvent) => {
    e.stopPropagation()
    setResizeDirection(direction)
    setDragStart({ x: e.clientX, y: e.clientY })
    setInitialBounds({ x: pixelX, y: pixelY, width: pixelWidth, height: pixelHeight })
  }

  // Handle rotation start
  const handleRotationStart = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!fieldRef.current) return
    
    const rect = fieldRef.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    
    setIsRotating(true)
    setRotationStart({
      x: e.clientX - centerX,
      y: e.clientY - centerY,
      initialRotation: field.rotation || 0,
    })
  }

  const getFieldIcon = () => {
    switch (field.type) {
      case "text": return <Type className="w-3 h-3" />
      case "image": return <ImageIcon className="w-3 h-3" />
      case "date": return <Calendar className="w-3 h-3" />
      case "table": return <TableIcon className="w-3 h-3" />
    }
  }

  // Column Resizing State
  const [resizingColIndex, setResizingColIndex] = useState<number | null>(null)
  const [initialColumns, setInitialColumns] = useState<any[] | null>(null)

  // Handle column resize start
  const handleColResizeStart = (index: number) => (e: React.MouseEvent) => {
      e.stopPropagation()
      e.preventDefault()
      setResizingColIndex(index)
      setDragStart({ x: e.clientX, y: e.clientY }) // Initial drag position
      // Snapshot current columns to avoid stale state issues during rapid updates
      setInitialColumns(JSON.parse(JSON.stringify(field.columns || [])))
  }

  // Effect for handling column resize move/end
  useEffect(() => {
    if (resizingColIndex !== null && initialColumns) {
        const handleColResizeMove = (e: MouseEvent) => {
            if (!initialColumns) return

            const deltaX = e.clientX - dragStart.x
            // Convert deltaX to percentage relative to the *field width*
            const deltaPercent = (deltaX / pixelWidth) * 100

            // Apply to column i and i+1 based on INITIAL columns
            const newCols = [...initialColumns]
            // We need deep copy if we are modifying objects, which JSON.parse/stringify did
            // But here we are creating a new array from the snapshot, but we need to modify specific items
            // referencing initialColumns is safe as it is state
            
            const leftCol = { ...newCols[resizingColIndex] }
            const rightCol = { ...newCols[resizingColIndex + 1] }

            if (!leftCol || !rightCol) return

            // Sensitivity check or min width check
            if (leftCol.width + deltaPercent < 5 || rightCol.width - deltaPercent < 5) return

            leftCol.width += deltaPercent
            rightCol.width -= deltaPercent

            newCols[resizingColIndex] = leftCol
            newCols[resizingColIndex + 1] = rightCol
            
            onUpdate({ columns: newCols })
        }

        const handleColResizeUp = () => {
            setResizingColIndex(null)
            setInitialColumns(null)
        }

        document.addEventListener("mousemove", handleColResizeMove)
        document.addEventListener("mouseup", handleColResizeUp)
        return () => {
            document.removeEventListener("mousemove", handleColResizeMove)
            document.removeEventListener("mouseup", handleColResizeUp)
        }
    }
  }, [resizingColIndex, initialColumns, pixelWidth, dragStart, onUpdate])


  return (
    <div
      ref={fieldRef}
      className={`absolute cursor-move group ${isSelected ? "z-10" : "z-0"}`}
      style={{
        left: pixelX,
        top: pixelY,
        width: pixelWidth,
        height: pixelHeight,
        transform: field.rotation ? `rotate(${field.rotation}deg)` : undefined,
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onClick={(e) => {
        e.stopPropagation()
        onSelect()
      }}
    >
      {/* Field Content */}
      <div
        className={`w-full h-full rounded border-2 flex items-start transition-all ${
          isSelected
            ? "border-primary border-dashed shadow-lg"
            : "border-gray-300 group-hover:border-primary/50"
        }`}
        style={{
          backgroundColor: field.backgroundColor,
          borderColor: isSelected ? undefined : field.borderColor,
          borderWidth: isSelected ? undefined : field.borderWidth,
          borderRadius: field.borderRadiusTopLeft !== undefined || 
                       field.borderRadiusTopRight !== undefined || 
                       field.borderRadiusBottomRight !== undefined || 
                       field.borderRadiusBottomLeft !== undefined
            ? `${field.borderRadiusTopLeft || 0}px ${field.borderRadiusTopRight || 0}px ${field.borderRadiusBottomRight || 0}px ${field.borderRadiusBottomLeft || 0}px`
            : field.borderRadius,
          fontSize: (field.fontSize || 16) * scale,
          fontFamily: field.fontFamily,
          fontWeight: field.fontWeight,
          textAlign: field.textAlign || 'center',
          color: field.textColor,
          justifyContent: field.textAlign === 'left' ? 'flex-start' : (field.textAlign === 'right' ? 'flex-end' : 'center'),
          paddingLeft: "8px",
          paddingRight: "8px",
          paddingTop: "8px"
        }}
      >
        {field.type === "text" && (
          <span className="truncate w-full" style={{ color: "inherit", fontSize: "inherit", fontWeight: "inherit", textAlign: "inherit" }}>
            {field.placeholder || "Text field"}
          </span>
        )}
        {field.type === "image" && (
          <ImageIcon className="w-6 h-6 text-muted-foreground" />
        )}
        {field.type === "date" && (
          <span style={{ color: "inherit", fontSize: "inherit", fontWeight: "inherit" }}>
             {field.placeholder || "MM/DD/YYYY"}
          </span>
        )}
        {field.type === "table" && (
          <div className="w-full h-full flex flex-col overflow-hidden bg-white">
             {/* Table Header */}
             {field.showTableHeader && (
               <div 
                  className="flex w-full border-b border-gray-300 relative"
                  style={{
                      backgroundColor: field.headerBackgroundColor || "#f3f4f6",
                      color: field.headerTextColor || "#000000",
                      height: "30px", // Fixed header height for preview
                      fontSize: (field.tableHeaderFontSize || 12) * scale,
                      fontFamily: field.tableFontFamily || field.fontFamily || "inherit",
                      fontWeight: "bold"
                  }}
               >
                  {(field.columns || []).map((col, index) => (
                      <div 
                          key={col.id}
                          className="flex items-center px-2 border-r border-gray-300 last:border-r-0 truncate relative"
                          style={{ width: `${col.width}%` }}
                      >
                          {col.header}
                          {/* Resize Handle */}
                          {isSelected && index < (field.columns?.length || 0) - 1 && (
                              <div 
                                  className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-blue-400/50 z-20"
                                  style={{ transform: "translateX(50%)" }}
                                  onMouseDown={handleColResizeStart(index)}
                                  onClick={(e) => e.stopPropagation()}
                              />
                          )}
                      </div>
                  ))}
                  {(!field.columns || field.columns.length === 0) && (
                      <div className="w-full px-2 py-1 text-xs italic text-gray-500">No columns defined</div>
                  )}
               </div>
             )}
             
             {/* Table Body (Mock Rows) */}
             <div className="flex-1 overflow-hidden" 
                style={{ 
                    fontFamily: field.tableFontFamily || field.fontFamily || "inherit",
                    fontSize: (field.tableBodyFontSize || 12) * scale
                }}
             >
                {[1, 2, 3].map((row, rowIndex) => (
                     <div 
                        key={rowIndex} 
                        className="flex w-full border-b border-gray-200"
                        style={{
                             backgroundColor: rowIndex % 2 === 1 ? (field.alternateRowColor || "#ffffff") : "#ffffff",
                             height: field.rowHeight ? `${field.rowHeight}px` : "24px"
                        }}
                     >
                        {(field.columns || []).map((col) => (
                            <div 
                                key={`${rowIndex}-${col.id}`}
                                className="flex items-center px-2 border-r border-gray-200 last:border-r-0 text-gray-400 text-xs truncate"
                                style={{ width: `${col.width}%` }}
                            >
                                {col.key}
                            </div>
                        ))}
                     </div>
                ))}
             </div>
          </div>
        )}
      </div>

      {/* Selection Overlay */}
      {isSelected && (
        <>
          {/* Label */}
          <div className="absolute -top-6 left-0 bg-primary text-primary-foreground text-xs px-2 py-1 rounded flex items-center gap-1 whitespace-nowrap">
            {getFieldIcon()}
            <span>{field.label}</span>
          </div>

          {/* Duplicate Button */}
          <Button
            variant="outline"
            size="icon"
            className="absolute -top-6 -right-14 h-6 w-6 bg-white border-primary hover:bg-primary hover:text-white"
            onClick={(e) => {
              e.stopPropagation()
              onDuplicate?.()
            }}
            title="Duplicate Field"
          >
            <Copy className="w-3 h-3" />
          </Button>

          {/* Delete Button */}
          <Button
            variant="destructive"
            size="icon"
            className="absolute -top-6 -right-6 h-6 w-6"
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
          >
            <Trash2 className="w-3 h-3" />
          </Button>

          {/* Rotation Handle */}
          <div
            className="absolute"
            style={{ top: "-60px", left: "50%", transform: "translateX(-50%)" }}
          >
            <div
              className="absolute w-0.5 h-8 bg-gradient-to-b from-primary to-primary/40"
              style={{ left: "50%", top: "8px", transform: "translateX(-50%)" }}
            />
            <button
              className="rotation-handle absolute w-6 h-6 bg-white rounded-full cursor-grab hover:bg-primary hover:text-white active:cursor-grabbing transition-all shadow-lg border-2 border-primary hover:shadow-xl flex items-center justify-center group"
              style={{ left: "50%", top: 0, transform: "translateX(-50%)" }}
              onMouseDown={handleRotationStart}
              onClick={(e) => e.stopPropagation()}
              title={`Rotate: ${field.rotation || 0}°`}
            >
              <RotateCw className="w-3 h-3 text-primary group-hover:text-white" />
            </button>
          </div>

          {/* Rotation Angle Display */}
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-primary text-white font-mono text-xs px-2.5 py-1 rounded shadow-md border border-primary/80 pointer-events-none whitespace-nowrap font-semibold">
            {Math.round(field.rotation || 0)}°
          </div>

          {/* Corner Resize Handles */}
          <div
            className="absolute -top-1 -left-1 w-3 h-3 bg-primary rounded-full cursor-nwse-resize border-2 border-white"
            onMouseDown={handleResizeStart('nw')}
            onClick={(e) => e.stopPropagation()}
          />
          <div
            className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full cursor-nesw-resize border-2 border-white"
            onMouseDown={handleResizeStart('ne')}
            onClick={(e) => e.stopPropagation()}
          />
          <div
            className="absolute -bottom-1 -left-1 w-3 h-3 bg-primary rounded-full cursor-nesw-resize border-2 border-white"
            onMouseDown={handleResizeStart('sw')}
            onClick={(e) => e.stopPropagation()}
          />
          <div
            className="absolute -bottom-1 -right-1 w-3 h-3 bg-primary rounded-full cursor-nwse-resize border-2 border-white"
            onMouseDown={handleResizeStart('se')}
            onClick={(e) => e.stopPropagation()}
          />
          
          {/* Edge Resize Handles */}
          <div
            className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-primary rounded-full cursor-ns-resize border-2 border-white"
            onMouseDown={handleResizeStart('n')}
            onClick={(e) => e.stopPropagation()}
          />
          <div
            className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-primary rounded-full cursor-ns-resize border-2 border-white"
            onMouseDown={handleResizeStart('s')}
            onClick={(e) => e.stopPropagation()}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 -left-1 w-3 h-3 bg-primary rounded-full cursor-ew-resize border-2 border-white"
            onMouseDown={handleResizeStart('w')}
            onClick={(e) => e.stopPropagation()}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 -right-1 w-3 h-3 bg-primary rounded-full cursor-ew-resize border-2 border-white"
            onMouseDown={handleResizeStart('e')}
            onClick={(e) => e.stopPropagation()}
          />

          {/* Dimension Labels */}
          <div className="absolute -bottom-6 left-0 text-xs text-muted-foreground">
            {Math.round(pixelWidth)} × {Math.round(pixelHeight)}px
          </div>
        </>
      )}

      {/* Drag Handle */}
      {isSelected && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <GripVertical className="w-4 h-4 text-primary/50" />
        </div>
      )}
    </div>
  )
}
