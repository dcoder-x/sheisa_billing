'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Plus, Trash2, FileText, Image as ImageIcon, FileDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { toast } from 'sonner';
import { TemplateBuilder } from '@/components/template-builder/template-builder';
import { TemplateGenerateModal } from '@/components/template-builder/template-generate-modal';
import { PdfThumbnail } from '@/components/template-builder/pdf-thumbnail';
import { SearchInput } from '@/components/ui/search-input';
import { PaginationControls } from '@/components/ui/pagination-controls';

export interface Template {
  id: string;
  name: string;
  type: 'PDF' | 'IMAGE' | 'CUSTOM';
  content?: string;
  sourceUrl?: string | null;
  design?: any;
  updatedAt: string | Date;
  fields?: any[];
}

interface TemplateManagerProps {
  initialTemplates: Template[];
  totalItems: number;
  pageSize: number;
}

export function TemplateManager({ initialTemplates, totalItems, pageSize }: TemplateManagerProps) {
  const router = useRouter();
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState<Partial<Template> | null>(null);
  const [newTemplateType, setNewTemplateType] = useState<'PDF' | 'IMAGE'>('IMAGE');
  
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [selectedTemplateForGeneration, setSelectedTemplateForGeneration] = useState<Template | null>(null);

  const handleCreateNew = (type: 'PDF' | 'IMAGE') => {
    setCurrentTemplate(null);
    setNewTemplateType(type);
    setIsBuilderOpen(true);
  };

  const handleEdit = (template: Template) => {
    setCurrentTemplate(template);
    setIsBuilderOpen(true);
  };

  const handleOpenGenerate = (template: Template, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedTemplateForGeneration(template);
    setIsGenerateModalOpen(true);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      const res = await fetch(`/api/templates/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      
      toast.success('Template deleted');
      // Refresh server state
      router.refresh();
    } catch (error) {
      toast.error('Failed to delete template');
    }
  };

  if (isBuilderOpen) {
    return (
      <div className="h-full flex flex-col">
        <div className="p-4 border-b bg-white flex justify-between items-center">
          <h1 className="text-xl font-bold">Template Builder</h1>
          <Button variant="ghost" onClick={() => setIsBuilderOpen(false)}>
            Close
          </Button>
        </div>
        <div className="flex-1 overflow-hidden p-4">
          <TemplateBuilder 
            type={currentTemplate ? (currentTemplate.type?.toLowerCase() === 'pdf' ? 'pdf' : 'image') : newTemplateType.toLowerCase() as 'pdf' | 'image'}
            templateId={currentTemplate?.id}
            onBack={() => {
              setIsBuilderOpen(false);
              router.refresh();
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Invoice Templates</h1>
          <p className="text-slate-600 mt-2">Create and manage templates for your invoices ({totalItems} total)</p>
        </div>
        <div className="flex items-center space-x-4">
          <SearchInput placeholder="Search templates..." />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2 shrink-0">
                <Plus className="w-4 h-4" />
                Create Template
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleCreateNew('PDF')}>
                <FileText className="w-4 h-4 mr-2" />
                New PDF Template
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleCreateNew('IMAGE')}>
                <ImageIcon className="w-4 h-4 mr-2" />
                New Image Template
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {initialTemplates.map((template) => (
          <Card 
            key={template.id} 
            className="hover:shadow-md transition-shadow cursor-pointer group flex flex-col h-full"
            onClick={() => handleEdit(template)}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xl font-semibold truncate pr-4">
                {template.name}
              </CardTitle>
              {template.type === 'PDF' ? <FileText className="w-5 h-5 text-red-400 shrink-0" /> : <ImageIcon className="w-5 h-5 text-blue-400 shrink-0" />}
            </CardHeader>
            <CardContent className="flex flex-col flex-1">
              <div className="aspect-video bg-slate-50 rounded-md mb-4 flex items-center justify-center border border-slate-100 overflow-hidden relative">
                {template.sourceUrl ? (
                  template.type === 'PDF' || template.sourceUrl.toLowerCase().endsWith('.pdf') ? (
                    <PdfThumbnail 
                      url={template.sourceUrl} 
                      width={300} 
                      className="w-full h-full object-cover grayscale opacity-80 group-hover:opacity-100 group-hover:grayscale-0 transition-all"
                    />
                  ) : (
                    <img 
                      src={template.sourceUrl} 
                      alt="Template Preview" 
                      className="w-full h-full object-cover opacity-80 grayscale group-hover:grayscale-0 group-hover:opacity-100 transition-all" 
                    />
                  )
                ) : (
                  <span className="text-xs text-slate-400">No Preview</span>
                )}
                {template.type && (
                  <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded">
                    {template.type}
                  </div>
                )}
              </div>
              <div className="flex justify-between items-center mt-auto">
                <div className="text-xs text-slate-400">
                  Updated: {new Date(template.updatedAt).toLocaleDateString()}
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50" 
                    onClick={(e) => handleOpenGenerate(template, e)}
                    title="Bulk Generate"
                  >
                    <FileDown className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity" 
                    onClick={(e) => handleDelete(template.id, e)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {initialTemplates.length === 0 && (
          <div className="col-span-full text-center py-12 bg-slate-50 rounded-lg border border-dashed border-slate-300">
            <p className="text-slate-500">No templates found matching your criteria.</p>
          </div>
        )}
      </div>

      <PaginationControls totalItems={totalItems} pageSize={pageSize} />

      {selectedTemplateForGeneration && (
        <TemplateGenerateModal 
          open={isGenerateModalOpen} 
          onClose={() => setIsGenerateModalOpen(false)} 
          templateId={selectedTemplateForGeneration.id}
          templateName={selectedTemplateForGeneration.name}
          placeholders={selectedTemplateForGeneration.fields || []}
        />
      )}
    </div>
  );
}
