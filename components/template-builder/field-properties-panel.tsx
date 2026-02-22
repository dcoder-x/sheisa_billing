"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trash2, X, Copy, AlignLeft, AlignCenter, AlignRight, Bold, Plus } from "lucide-react"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import type { DataField } from "./types"


interface FieldPropertiesPanelProps {
  field: DataField
  allFields: DataField[]
  onUpdate: (updates: Partial<DataField>) => void
  onDelete: () => void
  onDuplicate: () => void
  onClose: () => void
  canvasWidth?: number
  canvasHeight?: number
}

export function FieldPropertiesPanel({
  field,
  allFields,
  onUpdate,
  onDelete,
  onDuplicate,
  onClose,
  canvasWidth = 800,
  canvasHeight = 600
}: FieldPropertiesPanelProps) {
  const currentUnit = field.unit || "percent"
  
  // Check for duplicate labels
  const isDuplicateLabel = (label: string) => {
    return allFields.some(f => f.id !== field.id && f.label.toLowerCase() === label.toLowerCase())
  }
  
  const handleUnitChange = (newUnit: "percent" | "px") => {
    if (newUnit === currentUnit) return
    
    // Convert all position/size values to new unit
    const newX = newUnit === "px" 
      ? (field.x / 100) * canvasWidth 
      : (field.x / canvasWidth) * 100
    const newY = newUnit === "px"
      ? (field.y / 100) * canvasHeight
      : (field.y / canvasHeight) * 100
    const newWidth = newUnit === "px"
      ? (field.width / 100) * canvasWidth
      : (field.width / canvasWidth) * 100
    const newHeight = newUnit === "px"
      ? (field.height / 100) * canvasHeight
      : (field.height / canvasHeight) * 100
    
    onUpdate({ 
      unit: newUnit,
      x: newX,
      y: newY,
      width: newWidth,
      height: newHeight
    })
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Field Properties</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <Separator />

      {/* Basic Properties */}
      <div className="space-y-3">
        <div>
          <Label htmlFor="label">Label</Label>
          <Input
            id="label"
            value={field.label}
            onChange={(e) => onUpdate({ label: e.target.value })}
            onBlur={(e) => e.target.blur()}
            className={isDuplicateLabel(field.label) ? "border-red-500" : ""}
          />
          {isDuplicateLabel(field.label) && (
            <p className="text-xs text-red-500 mt-1">
              ⚠️ This label is already used by another field. Labels must be unique for CSV bulk generation.
            </p>
          )}
        </div>

        {field.type === "text" && (
          <>
            <div>
              <Label htmlFor="placeholder">Placeholder</Label>
              <Input
                id="placeholder"
                value={field.placeholder || ""}
                onChange={(e) => onUpdate({ placeholder: e.target.value })}
                onBlur={(e) => e.target.blur()}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="multiline">Multiline</Label>
              <Switch
                id="multiline"
                checked={field.multiline}
                onCheckedChange={(checked) => onUpdate({ multiline: checked })}
              />
            </div>
          </>
        )}

        <div className="flex items-center justify-between">
          <Label htmlFor="required">Required Field</Label>
          <Switch
            id="required"
            checked={field.required}
            onCheckedChange={(checked) => onUpdate({ required: checked })}
          />
        </div>

      </div>

      <Separator />

      {/* Position & Size */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-sm">Position & Size</h4>
          <Select value={currentUnit} onValueChange={(value: "percent" | "px") => handleUnitChange(value)}>
            <SelectTrigger className="w-16 h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="percent">%</SelectItem>
              <SelectItem value="px">px</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label htmlFor="x" className="text-xs">X ({currentUnit === "percent" ? "%" : "px"})</Label>
            <Input
              id="x"
              type="number"
              value={Math.round(field.x * 10) / 10}
              onChange={(e) => onUpdate({ x: parseFloat(e.target.value) })}
              onBlur={(e) => e.target.blur()}
              step={currentUnit === "percent" ? "0.1" : "1"}
            />
          </div>
          <div>
            <Label htmlFor="y" className="text-xs">Y ({currentUnit === "percent" ? "%" : "px"})</Label>
            <Input
              id="y"
              type="number"
              value={Math.round(field.y * 10) / 10}
              onChange={(e) => onUpdate({ y: parseFloat(e.target.value) })}
              onBlur={(e) => e.target.blur()}
              step={currentUnit === "percent" ? "0.1" : "1"}
            />
          </div>
          <div>
            <Label htmlFor="width" className="text-xs">Width ({currentUnit === "percent" ? "%" : "px"})</Label>
            <Input
              id="width"
              type="number"
              value={Math.round(field.width * 10) / 10}
              onChange={(e) => onUpdate({ width: parseFloat(e.target.value) })}
              onBlur={(e) => e.target.blur()}
              step={currentUnit === "percent" ? "0.1" : "1"}
            />
          </div>
          <div>
            <Label htmlFor="height" className="text-xs">Height ({currentUnit === "percent" ? "%" : "px"})</Label>
            <Input
              id="height"
              type="number"
              value={Math.round(field.height * 10) / 10}
              onChange={(e) => onUpdate({ height: parseFloat(e.target.value) })}
              onBlur={(e) => e.target.blur()}
              step={currentUnit === "percent" ? "0.1" : "1"}
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Styling */}
      {(field.type === "text" || field.type === "date") && (
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Text Styling</h4>
          <div>
            <Label htmlFor="fontSize" className="text-xs">Font Size</Label>
            <Input
              id="fontSize"
              type="number"
              value={field.fontSize}
              onChange={(e) => onUpdate({ fontSize: parseInt(e.target.value) })}
              onBlur={(e) => e.target.blur()}
              min="8"
              max="72"
            />
          </div>

          <div>
            <Label className="text-xs mb-1.5 block">Font Style</Label>
            <div className="flex gap-2">
                <Button
                  variant={field.fontWeight === 'bold' ? 'default' : 'outline'}
                  size="sm"
                  className="flex-1 h-8"
                  onClick={() => onUpdate({ fontWeight: field.fontWeight === 'bold' ? 'normal' : 'bold' })}
                >
                  <Bold className="w-4 h-4" />
                </Button>
            </div>
          </div>

          <div>
            <Label className="text-xs mb-1.5 block">Text Align</Label>
            <ToggleGroup type="single" value={field.textAlign || "left"} onValueChange={(val) => { if(val) onUpdate({ textAlign: val as any }) }}>
                <ToggleGroupItem value="left" size="sm" className="h-8 flex-1"><AlignLeft className="w-4 h-4" /></ToggleGroupItem>
                <ToggleGroupItem value="center" size="sm" className="h-8 flex-1"><AlignCenter className="w-4 h-4" /></ToggleGroupItem>
                <ToggleGroupItem value="right" size="sm" className="h-8 flex-1"><AlignRight className="w-4 h-4" /></ToggleGroupItem>
            </ToggleGroup>
          </div>

          <div>
            <Label htmlFor="textColor" className="text-xs">Text Color</Label>
            <div className="flex gap-2">
              <Input
                id="textColor"
                type="color"
                value={field.textColor}
                onChange={(e) => onUpdate({ textColor: e.target.value })}
                onBlur={(e) => e.target.blur()}
                className="w-12 h-9 p-1"
              />
              <Input
                value={field.textColor}
                onChange={(e) => onUpdate({ textColor: e.target.value })}
                onBlur={(e) => e.target.blur()}
                className="flex-1"
              />
            </div>
          </div>
          <Separator />
        </div>
      )}

      {/* Border & Background */}
      <div className="space-y-3">
        <h4 className="font-medium text-sm">Border & Background</h4>
        <div>
          <Label htmlFor="backgroundColor" className="text-xs">Background</Label>
          <div className="flex gap-2">
            <Input
              id="backgroundColor"
              type="color"
              value={field.backgroundColor}
              onChange={(e) => onUpdate({ backgroundColor: e.target.value })}
              onBlur={(e) => e.target.blur()}
              className="w-12 h-9 p-1"
            />
            <Input
              value={field.backgroundColor}
              onChange={(e) => onUpdate({ backgroundColor: e.target.value })}
              onBlur={(e) => e.target.blur()}
              className="flex-1"
            />
          </div>
        </div>
        <div>
          <Label htmlFor="borderColor" className="text-xs">Border Color</Label>
          <div className="flex gap-2">
            <Input
              id="borderColor"
              type="color"
              value={field.borderColor}
              onChange={(e) => onUpdate({ borderColor: e.target.value })}
              onBlur={(e) => e.target.blur()}
              className="w-12 h-9 p-1"
            />
            <Input
              value={field.borderColor}
              onChange={(e) => onUpdate({ borderColor: e.target.value })}
              onBlur={(e) => e.target.blur()}
              className="flex-1"
            />
          </div>
        </div>
        {field.type === 'image' && (
          <div>
            <Label htmlFor="borderRadius" className="text-xs">
              Border Radius (All Corners)
            </Label>
            <Input
              id="borderRadius"
              type="number"
              value={field.borderRadius || 0}
              onChange={(e) => {
                const value = parseInt(e.target.value) || 0
                onUpdate({
                  borderRadius: value,
                  borderRadiusTopLeft: value,
                  borderRadiusTopRight: value,
                  borderRadiusBottomRight: value,
                  borderRadiusBottomLeft: value
                })
              }}
              onBlur={(e) => e.target.blur()}
              min="0"
              className="w-full h-9"
            />
          </div>
        )}

        <div>
          <Label htmlFor="borderWidth" className="text-xs">Border Width</Label>
          <Input
            id="borderWidth"
            type="number"
            value={field.borderWidth}
            onChange={(e) => onUpdate({ borderWidth: parseInt(e.target.value) })}
            onBlur={(e) => e.target.blur()}
            min="0"
            max="10"
          />
        </div>
      </div>

      <Separator />

      {/* Table Columns Management */}
      {field.type === "table" && (
        <div className="space-y-4">
          
          <div className="space-y-3">
             <h4 className="font-medium text-sm">Table Appearance</h4>
             
             <div className="flex items-center justify-between">
               <Label htmlFor="showTableHeader">Show Header</Label>
               <Switch
                 id="showTableHeader"
                 checked={field.showTableHeader}
                 onCheckedChange={(checked) => onUpdate({ showTableHeader: checked })}
               />
             </div>

             <div className="grid grid-cols-2 gap-2">
                <div>
                   <Label className="text-xs">Header Size</Label>
                   <Input 
                      type="number" 
                      value={field.tableHeaderFontSize || 12}
                      onChange={(e) => onUpdate({ tableHeaderFontSize: parseInt(e.target.value) })}
                      min="6" max="72"
                      className="h-8"
                   />
                </div>
                <div>
                   <Label className="text-xs">Body Size</Label>
                   <Input 
                      type="number" 
                      value={field.tableBodyFontSize || 12}
                      onChange={(e) => onUpdate({ tableBodyFontSize: parseInt(e.target.value) })}
                      min="6" max="72"
                      className="h-8"
                   />
                </div>
             </div>

             <div>
                <Label className="text-xs">Font Family</Label>
                <Select 
                    value={field.tableFontFamily || field.fontFamily || "Inter"} 
                    onValueChange={(value) => onUpdate({ tableFontFamily: value })}
                >
                    <SelectTrigger className="h-8">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Inter">Inter</SelectItem>
                        <SelectItem value="Arial">Arial</SelectItem>
                        <SelectItem value="Helvetica">Helvetica</SelectItem>
                        <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                        <SelectItem value="Courier New">Courier New</SelectItem>
                    </SelectContent>
                </Select>
             </div>
          </div>
          
          <Separator />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
               <h4 className="font-medium text-sm">Table Columns</h4>
               <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                      const newCol = { id: crypto.randomUUID(), header: "New Column", key: `col_${(field.columns?.length || 0) + 1}`, width: 20 };
                      onUpdate({ columns: [...(field.columns || []), newCol] });
                  }}
               >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Column
               </Button>
            </div>
            
            <div className="space-y-2">
              {(field.columns || []).map((col, index) => (
                  <div key={col.id} className="p-2 border rounded-md bg-slate-50 space-y-2">
                      <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-slate-500 w-4">{index + 1}</span>
                          <Input 
                              className="h-7 text-xs flex-1" 
                              placeholder="Header Name"
                              value={col.header}
                              onChange={(e) => {
                                  const newCols = [...(field.columns || [])];
                                  newCols[index] = { ...col, header: e.target.value };
                                  onUpdate({ columns: newCols });
                              }}
                          />
                          <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50"
                              onClick={() => {
                                  const newCols = field.columns?.filter(c => c.id !== col.id);
                                  onUpdate({ columns: newCols });
                              }}
                          >
                              <Trash2 className="w-3 h-3" />
                          </Button>
                      </div>
                      <div className="flex gap-2">
                           <div className="flex-1">
                               <Label className="text-[10px] text-slate-500">JSON Key</Label>
                               <Input 
                                  className="h-6 text-xs" 
                                  placeholder="item_name"
                                  value={col.key}
                                  onChange={(e) => {
                                      const newCols = [...(field.columns || [])];
                                      newCols[index] = { ...col, key: e.target.value };
                                      onUpdate({ columns: newCols });
                                  }}
                               />
                           </div>
                           <div className="w-20">
                               <Label className="text-[10px] text-slate-500">Width (%)</Label>
                               <Input 
                                  className="h-6 text-xs" 
                                  type="number"
                                  value={col.width}
                                  onChange={(e) => {
                                      const newCols = [...(field.columns || [])];
                                      newCols[index] = { ...col, width: parseFloat(e.target.value) };
                                      onUpdate({ columns: newCols });
                                  }}
                               />
                           </div>
                      </div>
                  </div>
              ))}
              {(!field.columns || field.columns.length === 0) && (
                  <div className="text-center py-4 text-sm text-slate-500 border border-dashed rounded-md">
                      No columns added yet.
                  </div>
              )}
            </div>
            
            <div className="space-y-2 pt-2">
               <Label className="text-xs">Row Height (px)</Label>
               <Input 
                  type="number" 
                  value={field.rowHeight || 24}
                  onChange={(e) => onUpdate({ rowHeight: parseInt(e.target.value) })}
                />
            </div>
             <div className="space-y-2">
               <Label className="text-xs">Header Background</Label>
               <div className="flex gap-2">
                  <Input 
                      type="color" 
                      className="w-8 h-8 p-0 border-0"
                      value={field.headerBackgroundColor || "#f3f4f6"}
                      onChange={(e) => onUpdate({ headerBackgroundColor: e.target.value })}
                  />
                   <Input 
                      className="flex-1 h-8"
                      value={field.headerBackgroundColor || "#f3f4f6"}
                      onChange={(e) => onUpdate({ headerBackgroundColor: e.target.value })}
                  />
               </div>
            </div>
          </div>
        </div>
      )}

      <Separator />

      {/* Actions */}
      <div className="space-y-2">
        <Button variant="outline" className="w-full" onClick={onDuplicate}>
          <Copy className="w-4 h-4 mr-2" />
          Duplicate Field
        </Button>

        <Button variant="destructive" className="w-full" onClick={onDelete}>
          <Trash2 className="w-4 h-4 mr-2" />
          Delete Field
        </Button>
      </div>
    </div>
  )
}
