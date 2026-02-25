import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ExternalLink, Mail, Phone, MapPin, Building2, Calendar, FileText } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

export default async function SupplierProfilePage({
  params,
}: {
  params: Promise<{ site: string; supplierId: string }>;
}) {
  const session = await getSession();

  if (!session || !session.entityId) {
    redirect('/login');
  }

  const awaitedParams = await params;
  const { site, supplierId } = awaitedParams;

  const supplier = await prisma.supplier.findUnique({
    where: {
      id: supplierId,
      entityId: session.entityId,
    },
    include: {
      invoices: {
        orderBy: { issueDate: 'desc' },
        take: 50,
      },
    },
  });

  if (!supplier) {
    return (
      <div className="p-8 max-w-5xl mx-auto flex flex-col items-center justify-center h-64 text-center">
        <h2 className="text-2xl font-semibold mb-2">Supplier Not Found</h2>
        <p className="text-slate-500 mb-6">The supplier you are looking for does not exist or you don't have access.</p>
        <Button asChild variant="outline">
          <Link href={`/sites/${site}/suppliers`}>Back to Suppliers</Link>
        </Button>
      </div>
    );
  }

  // Calculate stats
  const totalInvoices = supplier.invoices.length;
  const totalAmount = supplier.invoices.reduce((sum, inv) => sum + inv.amount, 0);

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon" className="h-8 w-8">
          <Link href={`/sites/${site}/suppliers`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
            {supplier.name}
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 align-middle">
              {supplier.status}
            </span>
          </h1>
          <p className="text-slate-500 text-sm mt-1">Added {format(new Date(supplier.createdAt), 'MMM d, yyyy')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="md:col-span-1 shadow-sm">
          <CardHeader>
            <CardTitle>Contact Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <Mail className="h-4 w-4 text-slate-400 mt-1 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium">Email</p>
                <p className="text-sm text-slate-600 break-all">{supplier.email || 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="h-4 w-4 text-slate-400 mt-1 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium">Phone</p>
                <p className="text-sm text-slate-600">{supplier.phone || 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="h-4 w-4 text-slate-400 mt-1 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium">Address</p>
                <p className="text-sm text-slate-600">{supplier.address || 'N/A'}</p>
              </div>
            </div>
            {supplier.bankAccount && (
              <div className="flex items-start gap-3 pt-4 border-t mt-4">
                <Building2 className="h-4 w-4 text-slate-400 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium">Bank Account</p>
                  <p className="text-sm text-slate-600">{supplier.bankAccount}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Financial Summary */}
        <Card className="md:col-span-2 shadow-sm">
          <CardHeader>
            <CardTitle>Financial Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="flex items-center gap-2 text-slate-500 mb-2">
                  <FileText className="h-4 w-4" />
                  <span className="text-sm font-medium">Total Invoices</span>
                </div>
                <p className="text-3xl font-bold text-slate-900">{totalInvoices}</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                <div className="flex items-center gap-2 text-blue-600 mb-2">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm font-medium">Total Value</span>
                </div>
                <p className="text-3xl font-bold text-blue-900">
                  {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(totalAmount)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions / Invoices Tab */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Transaction Lines</CardTitle>
          <CardDescription>Recent invoices and payment records for this supplier.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice Number</TableHead>
                <TableHead>Issue Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {supplier.invoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-slate-500">
                    No transactions found.
                  </TableCell>
                </TableRow>
              ) : (
                supplier.invoices.map((inv: any) => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-medium">{inv.invoiceNumber}</TableCell>
                    <TableCell>{format(new Date(inv.issueDate), 'MMM d, yyyy')}</TableCell>
                    <TableCell>
                      {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(inv.amount)}
                    </TableCell>
                    <TableCell>
                       <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        inv.status === 'PAID' ? 'bg-green-100 text-green-800' :
                        inv.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-slate-100 text-slate-800'
                       }`}>
                         {inv.status}
                       </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {inv.attachmentUrl ? (
                         <Button variant="outline" size="sm" asChild className="gap-2">
                           <a href={inv.attachmentUrl} target="_blank" rel="noopener noreferrer">
                             <ExternalLink className="h-3.5 w-3.5" />
                             PDF
                           </a>
                         </Button>
                      ) : (
                        <span className="text-xs text-slate-400">N/A</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
