import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { TemplateManager } from './template-manager';
import { Prisma } from '@prisma/client';
import { parseTemplateContent } from '@/lib/template-utils';

export default async function TemplatesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  if (session.role === 'SUPER_ADMIN') {
    redirect('/admin');
  }

  const entityId = session.entityId;
  if (!entityId) {
    return <div className="p-8">No entity context found</div>;
  }

  const awaitedSearchParams = await searchParams;
  const q = awaitedSearchParams?.q || '';
  const page = Number(awaitedSearchParams?.page) || 1;
  const pageSize = 12; // Adjusted to be 12 for grid layouts (divides cleanly by 1, 2, 3, 4)

  const where: Prisma.InvoiceTemplateWhereInput = {
    entityId,
  };

  if (q) {
    where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
    ];
  }

  const [dbTemplates, totalItems] = await Promise.all([
    prisma.invoiceTemplate.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.invoiceTemplate.count({ where }),
  ]);

  // Transform fields for the client
  const templates = dbTemplates.map((t) => ({
    ...t,
    fields: parseTemplateContent(t.content)
  }));

  return (
    <div className="h-full bg-slate-50">
      <TemplateManager 
        initialTemplates={templates as any} 
        totalItems={totalItems} 
        pageSize={pageSize} 
      />
    </div>
  );
}
