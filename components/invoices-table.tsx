'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MoreHorizontal } from 'lucide-react';

const invoices = [
  {
    id: '#100F950',
    price: '$250',
    date: '17 Set 2025, 8:45 am',
    status: 'Paid',
    statusColor: 'bg-green-50 text-green-700',
  },
  {
    id: '#100F522',
    price: '$12,780',
    date: '16 Set 2025, 11:30 pm',
    status: 'Pending',
    statusColor: 'bg-orange-50 text-orange-700',
  },
  {
    id: '#100F98F',
    price: '$740',
    date: '14 Set 2025, 2:00 am',
    status: 'Paid',
    statusColor: 'bg-green-50 text-green-700',
  },
  {
    id: '#100F98F',
    price: '$740',
    date: '14 Set 2025, 2:00 am',
    status: 'Paid',
    statusColor: 'bg-green-50 text-green-700',
  },
  {
    id: '#100DF40',
    price: '$17,890',
    date: '09 Set 2025, 4:30 pm',
    status: 'Cancel',
    statusColor: 'bg-red-50 text-red-700',
  },
];

export function InvoicesTable() {
  return (
    <Card className="bg-white border-slate-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Recent Orders</CardTitle>
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
              {invoices.map((invoice, index) => (
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
