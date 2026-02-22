"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Upload, Save, Eye, ArrowLeft, MoreVertical, Settings2, Plus, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCcw, Maximize } from "lucide-react"


import { useRouter, useSearchParams } from "next/navigation"
import { TemplateCanvas } from "./template-canvas"
import { FieldToolbar } from "./field-toolbar"
import { FieldPropertiesPanel } from "./field-properties-panel"
import { FileUploadDialog } from "./file-upload-dialog"
import { PreviewDialog } from "./preview-dialog"
import type { DataField, TemplateData, CanvasDimensions } from "./types"
import { nanoid } from "nanoid"
import { parseTemplateContent, serializeTemplateContent } from "@/lib/template-utils"
import axios from "axios"
import { useToast } from "@/hooks/use-toast"

interface TemplateBuilderProps {
  type: "image" | "pdf"
  templateId?: string
  onBack?: () => void
}

export function TemplateBuilder({ type, templateId, onBack }: TemplateBuilderProps) {

  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const editMode = !!templateId || !!searchParams?.get('edit')
  const [isLoading, setIsLoading] = useState(editMode)
  const [templateName, setTemplateName] = useState('')
  const [templateDescription, setTemplateDescription] = useState('')
  const [sourceFile, setSourceFile] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [sourceWidth, setSourceWidth] = useState(0)
  const [sourceHeight, setSourceHeight] = useState(0)
  const [fields, setFields] = useState<DataField[]>([])
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null)
  const [showUploadDialog, setShowUploadDialog] = useState(!editMode)
  const [showPreview, setShowPreview] = useState(false)
  const [currentTemplateId, setCurrentTemplateId] = useState<string | undefined>(templateId)
  const [isUploading, setIsUploading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null)
  const [unit, setUnit] = useState<"percent" | "px">("percent")
  const [canvasDimensions, setCanvasDimensions] = useState<CanvasDimensions>({
    width: 0,
    height: 0,
    scale: 1
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [numPages, setNumPages] = useState(1)
  const [showMobileToolbar, setShowMobileToolbar] = useState(false)
  const [showMobileProperties, setShowMobileProperties] = useState(false)
  const [zoom, setZoom] = useState(0) // Default to 0 (Fit to Screen)

  // Disable browser zoom gestures
  useEffect(() => {
    const preventDefault = (e: Event) => e.preventDefault();
    document.addEventListener('gesturestart', preventDefault);
    document.addEventListener('gesturechange', preventDefault);
    document.addEventListener('gestureend', preventDefault);
    return () => {
      document.removeEventListener('gesturestart', preventDefault);
      document.removeEventListener('gesturechange', preventDefault);
      document.removeEventListener('gestureend', preventDefault);
    }
  }, [])

  const handleZoomIn = () => {
    setZoom(prev => {
      const current = prev === 0 ? 100 : prev
      return Math.min(current + 25, 500)
    })
  }

  const handleZoomOut = () => {
    setZoom(prev => {
      const current = prev === 0 ? 100 : prev
      return Math.max(current - 25, 10)
    })
  }

  const handleResetZoom = () => setZoom(100)
  const handleFitZoom = () => setZoom(0)

  // Load existing template if in edit mode
  useEffect(() => {
    const loadTemplate = async () => {
      const idToLoad = templateId || searchParams?.get('edit')
      if (!idToLoad) {
        setIsLoading(false)
        return
      }

      try {
        const response = await axios.get(`/api/templates/${idToLoad}`)
        const template = response.data
        
        setTemplateName(template.name)
        setTemplateDescription(template.description || '')
        setSourceFile(template.sourceUrl)
        setSourceWidth(template.sourceWidth)
        setSourceHeight(template.sourceHeight)
        setFields(parseTemplateContent(template.content))
        setCurrentTemplateId(template.id)
        setShowUploadDialog(false)
      } catch (error) {
        console.error('Error loading template:', error)
        toast({
          title: "Error",
          description: "Failed to load template",
          variant: "destructive"
        })
        if (onBack) onBack(); else router.push('/dashboard/templates')
      } finally {
        setIsLoading(false)
      }

    }

    if (editMode) {
      loadTemplate()
    }
  }, [templateId, searchParams, editMode, router])

  useEffect(() => {
      // Only redirect if not loading and no source file is available
      if (!isLoading && !sourceFile && !showUploadDialog) {
        if (onBack) onBack(); else router.push("/dashboard")
      }
  }, [sourceFile, showUploadDialog, isLoading, router, onBack])


  // Auto-save effect for fields
  useEffect(() => {
    const saveTemplate = async () => {
      if (!currentTemplateId || fields.length === 0 || !sourceFile) return
      
      // Skip auto-save if there are duplicate field labels
      const labels = fields.map(f => (f.label || f.properties?.label || '').trim().toLowerCase()).filter(Boolean)
      const hasDuplicates = labels.some((l, i) => labels.indexOf(l) !== i)
      if (hasDuplicates) return
      
      try {
        setIsSaving(true)
        const content = serializeTemplateContent(fields)
        
        await axios.patch(`/api/templates/${currentTemplateId}`, {
          content: content,
          sourceWidth,
          sourceHeight,
        })
        
        setLastSaved(new Date())
      } catch (error) {
        console.error('Auto-save failed:', error)
      } finally {
        setIsSaving(false)
      }
    }

    // Clear existing timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current)
    }

    // Only auto-save if we have a template ID (edit mode)
    if (currentTemplateId) {
      // Set new timer for 2 seconds
      autoSaveTimerRef.current = setTimeout(() => {
        saveTemplate()
      }, 2000)
    }

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }
    }
  }, [fields, currentTemplateId, sourceFile, sourceWidth, sourceHeight])

  const selectedField = fields.find(f => f.id === selectedFieldId)

  const handleFileUpload = useCallback((file: File) => {
    setFile(file)
    const url = URL.createObjectURL(file)
    if (type === "image") {
      const img = new Image()
      img.onload = () => {
        setSourceFile(url)
        setSourceWidth(img.naturalWidth)
        setSourceHeight(img.naturalHeight)
        // Do NOT close modal here
      }
      img.src = url
    } else {
      // For PDF, dimensions will be set by PDFViewer component
      setSourceFile(url)
      setSourceWidth(595) // Temporary A4 width, will be updated
      setSourceHeight(842) // Temporary A4 height, will be updated
      // Do NOT close modal here
    }
  }, [type])

  const handlePDFLoadSuccess = useCallback((dimensions: { width: number; height: number; numPages: number }) => {
    setSourceWidth(dimensions.width)
    setSourceHeight(dimensions.height)
    setNumPages(dimensions.numPages)
  }, [])

  const handleAddField = useCallback((fieldType: DataField["type"], position?: { x: number; y: number }) => {
    const newField: DataField = {
      id: nanoid(),
      type: fieldType,
      x: position?.x ?? 10,
      y: position?.y ?? 10,
      width: 25,
      height: 8,
      label: `${fieldType.charAt(0).toUpperCase() + fieldType.slice(1)} Field`,
      placeholder: fieldType === "text" ? "Enter text..." : undefined,
      required: true,
      fontSize: 12,
      fontFamily: "Inter",
      fontWeight: "normal",
      textColor: "#000000",
      backgroundColor: "#ffffff",
      borderColor: "#d1d5db",
      borderWidth: 1,
      unit: unit,
      page: currentPage,
      // Default columns for table
      columns: fieldType === 'table' ? [
        { id: nanoid(), header: 'Description', key: 'description', width: 50 },
        { id: nanoid(), header: 'Quantity', key: 'quantity', width: 20 },
        { id: nanoid(), header: 'Amount', key: 'amount', width: 30 }
      ] : undefined,
      showTableHeader: fieldType === 'table' ? true : undefined,
      tableHeaderFontSize: fieldType === 'table' ? 12 : undefined,
      tableBodyFontSize: fieldType === 'table' ? 12 : undefined,
    }
    setFields(prev => [...prev, newField])
    setSelectedFieldId(newField.id)
  }, [unit, currentPage])

  const handleUpdateField = useCallback((fieldId: string, updates: Partial<DataField>) => {
    setFields(prev => prev.map(f => f.id === fieldId ? { ...f, ...updates } : f))
  }, [])

  const handleFieldSelect = useCallback((fieldId: string | null) => {
    setSelectedFieldId(fieldId)
    if (fieldId && window.innerWidth < 1024) {
      // Open properties panel on mobile when field is selected
      setShowMobileProperties(true)
    }
  }, [])

  const handleDeleteField = useCallback((fieldId: string) => {
    setFields(prev => prev.filter(f => f.id !== fieldId))
    if (selectedFieldId === fieldId) {
      setSelectedFieldId(null)
    }
  }, [selectedFieldId])

  const handleDuplicateField = useCallback((fieldId: string) => {
    const fieldToDuplicate = fields.find(f => f.id === fieldId)
    if (!fieldToDuplicate) return

    const newField: DataField = {
      ...fieldToDuplicate,
      id: nanoid(),
      label: `${fieldToDuplicate.label} (Copy)`,
      x: fieldToDuplicate.x + (fieldToDuplicate.unit === "percent" ? 2 : 10),
      y: fieldToDuplicate.y + (fieldToDuplicate.unit === "percent" ? 2 : 10),
    }

    setFields(prev => [...prev, newField])
    setSelectedFieldId(newField.id)
  }, [fields])

  // Handle updating template metadata (name, description, source file, thumbnail)
  const onMetadataUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (!currentTemplateId) {
      // If no template ID exists, treat as new template creation
      return onFormSubmit(e)
    }

    const formData = new FormData(e.currentTarget)
    const name = formData.get("template-name") as string
    const description = formData.get("template-description") as string
    
    if (!name || !name.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a template name",
        variant: "destructive"
      })
      return
    }
    
    setTemplateName(name)
    setTemplateDescription(description || '')
    setIsUploading(true)

    try {
      let updatedSourceUrl = sourceFile
      let thumbnailUrl: string | undefined

      // Upload new source file if changed
      if (file) {
        const uploadFormData = new FormData()
        uploadFormData.append('file', file)
        uploadFormData.append('type', 'template-source')
        uploadFormData.append('name', name)

        const uploadResponse = await axios.post('/api/upload', uploadFormData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })

        updatedSourceUrl = uploadResponse.data?.data?.url || uploadResponse.data?.url
        setSourceFile(updatedSourceUrl)
      }

      // Upload new thumbnail if provided
      if (thumbnailFile) {
        const thumbnailFormData = new FormData()
        thumbnailFormData.append('file', thumbnailFile)
        thumbnailFormData.append('type', 'template-thumbnail')
        thumbnailFormData.append('name', `${name}-thumbnail`)

        try {
          const thumbnailResponse = await axios.post('/api/upload', thumbnailFormData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          })
          thumbnailUrl = thumbnailResponse.data?.data?.url || thumbnailResponse.data?.url
        } catch (error) {
          console.error('Failed to upload thumbnail:', error)
        }
      }

      // Update template with new metadata
      const templateContent = serializeTemplateContent(fields)
      const updateData: any = {
        name: name,
        description: description || undefined,
        content: templateContent,
        sourceUrl: updatedSourceUrl,
        sourceWidth,
        sourceHeight,
      }

      if (thumbnailUrl) {
        updateData.thumbnail = thumbnailUrl
      }

      await axios.put(`/api/templates/${currentTemplateId}`, updateData, {
        headers: { 'Content-Type': 'application/json' }
      })

      setShowUploadDialog(false)
      setFile(null)
      setThumbnailFile(null)
      toast({
        title: "Success",
        description: "Template updated successfully!"
      })
    } catch (error: any) {
      console.error("Error updating template:", error)
      
      let errorMessage = "Failed to update template. Please try again."
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error.message) {
        errorMessage = error.message
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setIsUploading(false)
    }
  }


  const onFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (!file) {
      toast({
        title: "Validation Error",
        description: "Please select a file first",
        variant: "destructive"
      })
      return
    }

    const formData = new FormData(e.currentTarget)
    const name = formData.get("template-name") as string
    const description = formData.get("template-description") as string
    
    if (!name || !name.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a template name",
        variant: "destructive"
      })
      return
    }
    
    setTemplateName(name)
    setTemplateDescription(description || '')
    setIsUploading(true)

    try {
      // Upload file to cloud storage first
      const uploadFormData = new FormData()
      uploadFormData.append('file', file)
      uploadFormData.append('type', 'template-source')
      uploadFormData.append('name', name)

      const uploadResponse = await axios.post('/api/upload', uploadFormData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      // Extract URL from nested response structure: response.data.data.url
      const remoteUrl = uploadResponse.data?.data?.url || uploadResponse.data?.url

      // Upload thumbnail if provided
      let thumbnailUrl: string | undefined
      if (thumbnailFile) {
        const thumbnailFormData = new FormData()
        thumbnailFormData.append('file', thumbnailFile)
        thumbnailFormData.append('type', 'template-thumbnail')
        thumbnailFormData.append('name', `${name}-thumbnail`)

        try {
          const thumbnailResponse = await axios.post('/api/upload', thumbnailFormData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          })
          // Extract URL from nested response structure: response.data.data.url
          thumbnailUrl = thumbnailResponse.data?.data?.url || thumbnailResponse.data?.url
        } catch (error) {
          console.error('Failed to upload thumbnail:', error)
          // Continue without thumbnail if upload fails
        }
      }
      // Now create template with remote URL
      const templateContent = serializeTemplateContent(fields)
      const templateData = {
        name: name,
        description: description || undefined,
        thumbnail: thumbnailUrl,
        type: type.toUpperCase() as 'PDF' | 'IMAGE',
        content: templateContent,
        sourceUrl: remoteUrl,
        sourceWidth,
        sourceHeight,
        isDraft: true
      }

      const response = await axios.post('/api/templates', templateData, {
        headers: { 'Content-Type': 'application/json' }
      })

      const template = response.data
      setCurrentTemplateId(template.id)
      setSourceFile(remoteUrl) // Update sourceFile to use remote URL instead of blob
      setShowUploadDialog(false)
      toast({
        title: "Success",
        description: "Template created successfully!"
      })
    } catch (error: any) {
      console.error("Error saving template:", error)
      
      let errorMessage = "Failed to save template. Please try again."
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error.message) {
        errorMessage = error.message
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleSave = async (isDraft = true) => {
    if (!sourceFile) {
      toast({
        title: "Validation Error",
        description: "Please upload a file first",
        variant: "destructive"
      })
      return
    }

    // Strict duplicate field label check — block save
    const labels = fields.map(f => (f.label || (f as any).properties?.label || '').trim())
    const lowered = labels.map(l => l.toLowerCase())
    const duplicates = labels.filter((l, i) => l && lowered.indexOf(l.toLowerCase()) !== i)
    if (duplicates.length > 0) {
      toast({
        title: "Duplicate Field Names",
        description: `Change duplicate field name before saving: ${[...new Set(duplicates)].join(', ')}`,
        variant: "destructive",
        duration: 6000,
      })
      return
    }

    try {
      let finalSourceUrl = sourceFile

      // If sourceFile is a blob URL, upload it to cloud storage first
      if (sourceFile.startsWith('blob:') && file) {
        const uploadFormData = new FormData()
        uploadFormData.append('file', file)
        uploadFormData.append('type', 'template-source')
        uploadFormData.append('name', templateName || 'template')

        const uploadResponse = await axios.post('/api/upload', uploadFormData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })

        // Extract URL from nested response structure
        finalSourceUrl = uploadResponse.data?.data?.url || uploadResponse.data?.url
        setSourceFile(finalSourceUrl) // Update state with remote URL
      }

      const templateContent = serializeTemplateContent(fields)

      const templateData = {
        name: templateName,
        type: type.toUpperCase() as 'PDF' | 'IMAGE',
        content: templateContent,
        sourceUrl: finalSourceUrl,
        sourceWidth,
        sourceHeight,
        isDraft
      }

      let response
      if (currentTemplateId) {
        // Update existing template
        response = await axios.put(`/api/templates/${currentTemplateId}`, templateData, {
          headers: { 'Content-Type': 'application/json' }
        })
      } else {
        // Create new template
        response = await axios.post('/api/templates', templateData, {
          headers: { 'Content-Type': 'application/json' }
        })
      }

      const template = response.data
      setCurrentTemplateId(template.id)
      toast({
        title: "Success",
        description: currentTemplateId ? "Template updated successfully!" : (isDraft ? "Template saved as draft!" : "Template published successfully!")
      })
      if (onBack) onBack(); else router.push('/dashboard/templates')

    } catch (error: any) {
      console.error("Error saving template:", error)
      
      let errorMessage = "Failed to save template. Please try again."
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error.message) {
        errorMessage = error.message
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      })
    }
  }

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading template...</div>
      </div>
    )
  }

  // if (!sourceFile) {
  //   return (
  //     <FileUploadDialog
  //       type={type}
  //       open={showUploadDialog}
  //       setTemplateName={setTemplateName}
  //       templateName={templateName}
  //       onFormSubmit={onFormSubmit}
  //       onFileSelect={handleFileUpload}
  //       onClose={() => router.push("/dashboard")}
  //     />
  //   )
  // }

  return (
    <>
      {sourceFile ? (
        <div 
          className="fixed inset-0  z-[10] flex flex-col overflow-hidden bg-background"

        >
      {/* Header */}
      <div className="border-b bg-background px-2 sm:px-4 py-2 sm:py-3 flex items-center justify-between z-[99]">
        <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
          <Button variant="ghost" size="icon" onClick={() => { if (onBack) onBack(); else router.push("/dashboard"); }} className="shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </Button>

          <div className="flex flex-col gap-1 min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Input
                value={templateName||`Untitled ${type === "pdf" ? "PDF" : "Image"} Template`}
                onChange={(e) => setTemplateName(e.target.value)}
                className="w-full sm:w-64 h-8 text-sm"
              />
              <span className="text-xs text-muted-foreground hidden sm:inline whitespace-nowrap">
                {sourceWidth} × {sourceHeight}px
              </span>
              {type === "pdf" && numPages > 1 && (
                <div className="flex items-center gap-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage <= 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    Page {currentPage} of {numPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => setCurrentPage(prev => Math.min(numPages, prev + 1))}
                    disabled={currentPage >= numPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
            {(isSaving || lastSaved) && (
              <p className="text-xs text-muted-foreground ml-1 hidden sm:block">
                {isSaving ? (
                  <span className="flex items-center gap-1">
                    <span className="animate-pulse">●</span> Saving...
                  </span>
                ) : (
                  <span>Saved {lastSaved && new Date(lastSaved).toLocaleTimeString()}</span>
                )}
              </p>
            )}
          </div>
        </div>
        
        {/* Desktop Actions */}
        <div className="hidden lg:flex items-center gap-2">
           {/* Zoom Controls */}
           <div className="flex items-center gap-1 border rounded-md p-1 mr-2">
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={handleZoomOut}>
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-xs w-12 text-center select-none font-medium">
              {zoom === 0 ? "Fit" : `${zoom}%`}
            </span>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={handleZoomIn}>
              <ZoomIn className="w-4 h-4" />
            </Button>
             <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={handleResetZoom} title="Reset to 100%">
              <RotateCcw className="w-3 h-3" />
            </Button>
             <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={handleFitZoom} title="Fit to Screen">
              <Maximize className="w-3 h-3" />
            </Button>
          </div>

          {/* Unit Selector */}
          <div className="flex items-center cursor-pointer gap-1 border rounded-md p-1">
            <Button
              variant={unit === "percent" ? "default" : "ghost"}
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => setUnit("percent")}
            >
              %
            </Button>
            <Button
              variant={unit === "px" ? "default" : "ghost"}
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => setUnit("px")}
            >
              px
            </Button>
          </div>
          <Button className="cursor-pointer" variant="outline" size="sm" onClick={() => setShowUploadDialog(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Change File
          </Button>
          {/* <Button className="cursor-pointer" variant="outline" size="sm" onClick={() => setShowPreview(true)}>
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Button> */}
          <Button className="cursor-pointer" variant="outline" size="sm" onClick={() => handleSave(true)}>
            <Save className="w-4 h-4 mr-2" />
            Save as Draft
          </Button>
          <Button className="cursor-pointer" size="sm" onClick={() => handleSave(false)}>
            <Save className="w-4 h-4 mr-2" />
            Publish
          </Button>
        </div>

        {/* Mobile Actions Menu */}
        <div className="lg:hidden flex items-center gap-2">
          {selectedField && (
            <Button variant="outline" size="sm" onClick={() => setShowMobileProperties(true)}>
              <Settings2 className="w-4 h-4" />
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-9 w-9">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => setShowPreview(true)}>
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowUploadDialog(true)}>
                <Upload className="w-4 h-4 mr-2" />
                Change File
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSave(true)}>
                <Save className="w-4 h-4 mr-2" />
                Save as Draft
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSave(false)}>
                <Save className="w-4 h-4 mr-2" />
                Publish
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Toolbar */}
        <div className="hidden lg:block w-20 border-r bg-muted/30 p-2">
          <FieldToolbar onAddField={handleAddField} />
        </div>

        {/* Mobile Floating Toolbar */}
        <Sheet open={showMobileToolbar} onOpenChange={setShowMobileToolbar}>
          <SheetContent side="left" className="w-[280px] sm:w-[320px] p-4">
            <SheetHeader>
              <SheetTitle>Add Fields</SheetTitle>
            </SheetHeader>
            <div className="mt-4">
              <FieldToolbar 
onAddField={handleAddField}
              />
            </div>
          </SheetContent>
        </Sheet>

        {/* Canvas */}
        <div className="flex-1 overflow-auto bg-muted/10 p-2 sm:p-4 lg:p-8 relative">
          <div className="min-h-full min-w-full flex items-center justify-center">
          {/* Mobile Add Field Button */}
          <Button
            className="lg:hidden fixed bottom-4 left-4 z-10 rounded-full w-14 h-14 shadow-lg"
            onClick={() => setShowMobileToolbar(true)}
          >
            <Plus className="w-6 h-6" />
          </Button>

            <TemplateCanvas
            type={type}
            sourceUrl={sourceFile}
            sourceWidth={sourceWidth}
            sourceHeight={sourceHeight}
            fields={fields}
            selectedFieldId={selectedFieldId}
            onFieldSelect={handleFieldSelect}
            onFieldUpdate={handleUpdateField}
            onFieldDelete={handleDeleteField}
            onCanvasDimensionsChange={setCanvasDimensions}
            onPDFLoadSuccess={handlePDFLoadSuccess}
            onDropField={handleAddField}
            currentPage={currentPage}
            zoom={zoom}
            onDuplicateField={handleDuplicateField}
          />
          </div>
        </div>

        {/* Desktop Properties Panel */}
        {selectedField && (
          <div className="hidden lg:block w-80 border-l bg-background overflow-y-auto">
            <FieldPropertiesPanel
              field={selectedField}
              allFields={fields}
              onUpdate={(updates: Partial<DataField>) => handleUpdateField(selectedField.id, updates)}
              onDelete={() => handleDeleteField(selectedField.id)}
              onDuplicate={() => handleDuplicateField(selectedField.id)}
              onClose={() => setSelectedFieldId(null)}
              canvasWidth={sourceWidth}
              canvasHeight={sourceHeight}
            />
          </div>
        )}

        {/* Mobile Properties Panel */}
        {selectedField && (
          <Sheet open={showMobileProperties} onOpenChange={setShowMobileProperties}>
            <SheetContent side="bottom" className="h-[80vh] p-0">
              <div className="h-full overflow-y-auto">
                <FieldPropertiesPanel
                  field={selectedField}
                  allFields={fields}
                  onUpdate={(updates: Partial<DataField>) => handleUpdateField(selectedField.id, updates)}
                  onDelete={() => {
                    handleDeleteField(selectedField.id)
                    setShowMobileProperties(false)
                  }}
                  onDuplicate={() => handleDuplicateField(selectedField.id)}
                  onClose={() => {
                    setSelectedFieldId(null)
                    setShowMobileProperties(false)
                  }}
                  canvasWidth={sourceWidth}
                  canvasHeight={sourceHeight}
                />
              </div>
            </SheetContent>
          </Sheet>
        )}
      </div>

      {/* Preview Dialog */}
      <PreviewDialog
        open={showPreview}
        onClose={() => setShowPreview(false)}
        sourceUrl={sourceFile}
        sourceWidth={sourceWidth}
        sourceHeight={sourceHeight}
        fields={fields}
        type={type}
      />

        </div>
      ) : null}

      {/* FileUploadDialog: Show when no file OR when user clicks Change File */}
      <FileUploadDialog
        type={type}
        open={!sourceFile || showUploadDialog}
        setTemplateName={setTemplateName}
        setTemplateDescription={setTemplateDescription}
        templateName={templateName}
        templateDescription={templateDescription}
        onFormSubmit={currentTemplateId ? onMetadataUpdate : onFormSubmit}
        onFileSelect={handleFileUpload}
        onThumbnailSelect={setThumbnailFile}
        sourceUrl={sourceFile as string}
        editMode={!!currentTemplateId}
        onClose={() => {
          if (sourceFile) {
            // If file exists, just close dialog
            setShowUploadDialog(false)
          } else {
            // If no file, go back or to dashboard
            if (onBack) onBack(); else router.push("/dashboard")
          }
        }}
        isUploading={isUploading}
      />
    </>

  )
}
