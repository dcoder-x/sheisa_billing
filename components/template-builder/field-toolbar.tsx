"use client"

import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Type, Image, Signature, Calendar, CheckSquare, Table as TableIcon } from "lucide-react"
import type { DataField } from "./types"

interface FieldToolbarProps {
  onAddField: (type: DataField["type"]) => void
  customLayoutStyles?: string
}

export const tools = [
    { type: "text" as const, icon: Type, label: "Text Field" },
    { type: "image" as const, icon: Image, label: "Image Field" },
    { type: "date" as const, icon: Calendar, label: "Date Field" },
    { type: "table" as const, icon: TableIcon, label: "Table Field" }
  ]
export function FieldToolbar({ onAddField, customLayoutStyles }: FieldToolbarProps) {


  const handleDragStart = (e: React.DragEvent, type: DataField["type"]) => {
    e.dataTransfer.setData("fieldType", type)
    e.dataTransfer.effectAllowed = "copy"
  }

  return (
    <TooltipProvider>
      <div className={`flex flex-col gap-2 ${customLayoutStyles}`}>
        {tools.map((tool) => (
          <Tooltip key={tool.type}>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-14 w-14 cursor-grab active:cursor-grabbing"
                draggable
                onDragStart={(e) => handleDragStart(e, tool.type)}
                onClick={() => onAddField(tool.type)}
              >
                <tool.icon className="w-5 h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>{tool.label} (Click or Drag)</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  )
}
