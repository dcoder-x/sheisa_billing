import { TemplateBuilder } from '@/components/template-builder/template-builder';
import { prisma } from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    [key: string]: string | string[] | undefined;
  }>;
}

export default async function BuilderPage(props: PageProps) {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  const params = await props.params;
  const { id } = params;

  // Verify template exists and belongs to organization (if applicable)
  // For now just check existence
  const template = await prisma.invoiceTemplate.findUnique({
    where: { id },
  });

  if (!template) {
    return notFound();
  }

  // We pass the ID to the client component which handles fetching full data
  // Or we could fetch here and pass initial data. 
  // The existing component fetches data itself.

  return (
    <div className="h-screen w-screen bg-slate-50 overflow-hidden">
        <TemplateBuilder 
            type={template.type === 'PDF' ? 'pdf' : 'image'} 
            templateId={template.id}
        />
    </div>
  );
}
