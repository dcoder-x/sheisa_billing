'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Loader2 } from 'lucide-react';

interface InvoiceData {
  id: string;
  price: string;
  date: string;
  status: string;
  statusColor: string;
}

export function InvoicesTable() {
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecent = async () => {
      try {
        const res = await fetch('/api/invoices/recent');
        if (res.ok) {
          const data = await res.json();
          setInvoices(data);
        }
      } catch (error) {
        console.error('Failed to fetch recent invoices', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecent();
  }, []);

  return (
    <Card className="bg-white border-slate-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Recent Invoices</CardTitle>
          <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            Week ▼
          </button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-2 font-medium text-slate-600">ID</th>
                <th className="text-left py-3 px-2 font-medium text-slate-600">Price</th>
                <th className="text-left py-3 px-2 font-medium text-slate-600">Date & Time</th>
                <th className="text-left py-3 px-2 font-medium text-slate-600">Status</th>
                <th className="text-left py-3 px-2 font-medium text-slate-600">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center">
                     <Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-400" />
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                     No recent invoices found.
                  </td>
                </tr>
              ) : invoices.map((invoice, index) => (
                <tr key={index} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 px-2 text-slate-900 font-medium">{invoice.id}</td>
                  <td className="py-3 px-2 text-green-600 font-medium">{invoice.price}</td>
                  <td className="py-3 px-2 text-slate-600">{invoice.date}</td>
                  <td className="py-3 px-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${invoice.statusColor}`}>
                      {invoice.status}
                    </span>
                  </td>
                  <td className="py-3 px-2">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreHorizontal className="w-4 h-4 text-slate-600" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
