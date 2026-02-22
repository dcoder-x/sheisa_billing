"use client"

import { useCallback, useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Upload, FileImage, FileText, Image } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"

interface FileUploadDialogProps {
  type: "image" | "pdf"
  open: boolean
  onFileSelect: (file: File) => void
  onThumbnailSelect?: (file: File | null) => void
  onFormSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  templateName: string
  templateDescription: string
  sourceUrl?: string
  setTemplateName: React.Dispatch<React.SetStateAction<string>>
  setTemplateDescription: React.Dispatch<React.SetStateAction<string>>
  onClose: () => void
  isUploading?: boolean
  editMode?: boolean
}

export function FileUploadDialog({ type, open, onFileSelect, onThumbnailSelect, onFormSubmit, templateName, templateDescription, setTemplateName, setTemplateDescription, onClose, isUploading, sourceUrl, editMode = false }: FileUploadDialogProps) {

  const [fileType, setFileType] = useState<string | undefined>()
  const [fileName, setFileName] = useState<string | undefined>()
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(sourceUrl)
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [thumbnailPreview, setThumbnailPreview] = useState<string | undefined>()

  // Sync previewUrl with sourceUrl prop
  useEffect(() => {
    if (sourceUrl && !previewUrl) {
      setPreviewUrl(sourceUrl)
    }
  }, [sourceUrl, previewUrl])

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl)
      }
      if (thumbnailPreview && thumbnailPreview.startsWith('blob:')) {
        URL.revokeObjectURL(thumbnailPreview)
      }
    }
  }, [previewUrl, thumbnailPreview])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFileType(file.type)
      setFileName(file.name)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
      onFileSelect(file)
    }
  }, [onFileSelect])

  const handleThumbnailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith("image/")) {
      setThumbnailFile(file)
      const url = URL.createObjectURL(file)
      setThumbnailPreview(url)
      onThumbnailSelect?.(file)
    } else if (file) {
      alert("Please upload a valid image file for the thumbnail")
    }
  }, [onThumbnailSelect])

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file) {
      const validType = type === "image" 
        ? file.type.startsWith("image/")
        : file.type === "application/pdf"
      
      if (validType) {
        setFileType(file.type)
        setFileName(file.name)
        const url = URL.createObjectURL(file)
        setPreviewUrl(url)
        onFileSelect(file)
      } else {
        alert(`Please upload a ${type === "image" ? "valid image" : "PDF"} file`)
      }
    }
  }, [type, onFileSelect])

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }, [])

  const acceptedTypes = type === "image" ? "image/*" : "application/pdf"
  const Icon = type === "image" ? FileImage : FileText

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <ScrollArea>

      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editMode ? 'Edit' : 'Create'} {type === "image" ? "Image" : "PDF"} template</DialogTitle>
          <DialogDescription>
            {editMode ? 'Update your template details and files' : 'Upload your ' + (type === "image" ? "image" : "PDF") + ' file to start building your template'}
          </DialogDescription>
        </DialogHeader>

        <form action="" onSubmit={onFormSubmit} className="space-y-6 overflow-y-scroll w-full max-h-[80vh] pr-2">

          <div className="space-y-2">
            <label htmlFor="template-name" className="text-sm font-medium">
              Template Name
            </label>
            <Input 
              id="template-name"
              name="template-name" 
              placeholder="Enter template Name" 
              value={templateName}
              onChange={e => setTemplateName(e.target.value)}
              required 
            />
          </div>

        {/* Description field (optional) */}
        <div className="space-y-2">
          <label htmlFor="template-description" className="text-sm font-medium">
            Description (Optional)
          </label>
          <Textarea
            id="template-description"
            name="template-description"
            placeholder="Enter a description for your template"
            value={templateDescription}
            onChange={(e) => setTemplateDescription(e.target.value)}
            rows={3}
            className="resize-none"
          />
        </div>

        {/* Thumbnail upload (optional) */}
        <div className="space-y-2">
          <label htmlFor="thumbnail-upload" className="text-sm font-medium">
            Thumbnail (Optional)
          </label>
          <div className="flex items-center gap-4">
            {thumbnailPreview ? (
              <div className="flex-1 flex items-center gap-4">
                <img
                  src={thumbnailPreview}
                  alt="Thumbnail preview"
                  className="w-20 h-20 object-cover rounded border"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById("thumbnail-upload")?.click()}
                >
                  Change Thumbnail
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => document.getElementById("thumbnail-upload")?.click()}
              >
                <Image className="w-4 h-4 mr-2" />
                Upload Thumbnail
              </Button>
            )}
          </div>
          <input
            id="thumbnail-upload"
            type="file"
            accept="image/*"
            onChange={handleThumbnailChange}
            className="hidden"
          />
        </div>

        {previewUrl ? (
          <div className="space-y-4">
            {/* Preview */}
            <div className="border-2 rounded-lg overflow-hidden bg-muted/10">
              {type === "image" || fileType?.startsWith("image/") ? (
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-64 object-contain"
                />
              ) : (
                <div className="h-64 flex items-center justify-center bg-gray-50">
                  <div className="text-center">
                    <FileText className="w-16 h-16 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">PDF file</p>
                    <p className="text-xs text-muted-foreground mt-1">{fileName}</p>
                  </div>
                </div>
              )}
            </div>
            {/* Change file button */}
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => document.getElementById("file-upload")?.click()}
            >
              <Upload className="w-4 h-4 mr-2" />
              Change File
            </Button>
          </div>
        ) : (
          <div
            className="border-2 border-dashed rounded-lg p-12 text-center hover:border-primary transition-colors cursor-pointer"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => document.getElementById("file-upload")?.click()}
          >
            <Icon className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-2">
              Drag and drop your {type === "image" ? "image" : "PDF"} here, or click to browse
            </p>
            <p className="text-xs text-muted-foreground">
              {type === "image" ? "Supports: JPG, PNG, GIF, SVG" : "Supports: PDF files"}
            </p>
          </div>
        )}

        <input
          id="file-upload"
          type="file"
          accept={acceptedTypes}
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="flex justify-end gap-2">
          <Button variant="outline" type="button" className="cursor-pointer" onClick={onClose} disabled={isUploading}>
            Cancel
          </Button>
          <Button variant="default" type="submit" className="cursor-pointer" disabled={isUploading}>
            {isUploading ? (editMode ? "Updating..." : "Creating...") : (editMode ? "Update Template" : "Create Template")}
          </Button>
        </div>
        </form>


      </DialogContent>
      </ScrollArea>
    </Dialog>
  )
}
