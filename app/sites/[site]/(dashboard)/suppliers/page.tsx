import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { SupplierManager } from './supplier-manager';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export default async function SuppliersPage({
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

  if (session.role === 'ENTITY_USER') {
    redirect('/');
  }

  const entityId = session.entityId;
  if (!entityId) {
    return <div className="p-8">No entity context found</div>;
  }

  const awaitedSearchParams = await searchParams;
  const q = awaitedSearchParams?.q || '';
  const page = Number(awaitedSearchParams?.page) || 1;
  const pageSize = 10;

  const where: Prisma.SupplierWhereInput = {
    entityId,
  };

  if (q) {
    where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { email: { contains: q, mode: 'insensitive' } },
      { phone: { contains: q, mode: 'insensitive' } },
    ];
  }

  const [suppliers, totalItems] = await Promise.all([
    prisma.supplier.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        _count: {
          select: { invoices: true }
        }
      }
    }),
    prisma.supplier.count({ where }),
  ]);

  return (
    <div className="h-full bg-slate-50">
      <SupplierManager 
        initialSuppliers={suppliers} 
        totalItems={totalItems} 
        pageSize={pageSize} 
      />
    </div>
  );
}
