import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, FileText } from 'lucide-react';
import Link from 'next/link';
import { SearchInput } from '@/components/ui/search-input';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { InvoiceStatusDropdown } from './components/invoice-status-dropdown';
import { Prisma } from '@prisma/client';

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; status?: string }>;
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
    return <div className="p-8">No entity context found.</div>;
  }

  const awaitedSearchParams = await searchParams;
  const q = awaitedSearchParams?.q || '';
  const page = Number(awaitedSearchParams?.page) || 1;
  const statusFilter = awaitedSearchParams?.status || '';
  const pageSize = 10;

  // Build the where clause
  const where: Prisma.InvoiceWhereInput = {
    entityId,
  };

  if (q) {
    where.OR = [
      { invoiceNumber: { contains: q, mode: 'insensitive' } },
      { supplier: { name: { contains: q, mode: 'insensitive' } } },
    ];
  }

  if (statusFilter) {
    where.status = statusFilter as any;
  }

  const [invoices, totalItems] = await Promise.all([
    prisma.invoice.findMany({
      where,
      include: { supplier: true },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.invoice.count({ where }),
  ]);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Invoices</h1>
          <p className="text-slate-600 mt-2">Manage your invoices and payments</p>
        </div>
      </div>

      <Card className="bg-white border-slate-200">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle>All Invoices</CardTitle>
              <CardDescription>
                {totalItems} invoice{totalItems !== 1 ? 's' : ''} found
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <SearchInput placeholder="Search invoice # or supplier..." />
              {/* Could add a Status Filter Dropdown here later if needed */}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">No invoices found matching your criteria.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/50">
                      <th className="text-left py-3 px-4 font-medium text-slate-600">Invoice #</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-600">Supplier</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-600">Issue Date</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-600">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-600">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((invoice) => (
                      <tr key={invoice.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 text-slate-900 font-medium font-mono text-xs">
                          {invoice.invoiceNumber}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {invoice.supplier ? (
                            invoice.supplier.name
                          ) : (
                            <span className="text-slate-400 italic text-xs">No supplier</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {new Date(invoice.issueDate).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          <InvoiceStatusDropdown invoiceId={invoice.id} currentStatus={invoice.status} />
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1">
                            {invoice.attachmentUrl && (
                              <Link href={invoice.attachmentUrl} target="_blank">
                                <Button variant="ghost" size="sm" className="h-8 px-2 text-blue-600 hover:bg-blue-50 hover:text-blue-700">
                                  <Download className="w-4 h-4 mr-1.5" />
                                  <span className="text-xs">Download</span>
                                </Button>
                              </Link>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <PaginationControls totalItems={totalItems} pageSize={pageSize} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
