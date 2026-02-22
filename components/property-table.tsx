'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MoreHorizontal, Search, SlidersHorizontal } from 'lucide-react';

const properties = [
  {
    id: 1,
    name: 'Downtown Office',
    location: 'San Francisco, CA',
    date: 'Jan 15, 2025',
    contact: 'John Smith',
    engagement: '95%',
    price: '$5,890',
  },
  {
    id: 2,
    name: 'Tech Hub Building',
    location: 'Palo Alto, CA',
    date: 'Feb 20, 2025',
    contact: 'Jane Doe',
    engagement: '87%',
    price: '$7,200',
  },
  {
    id: 3,
    name: 'Corporate Plaza',
    location: 'Mountain View, CA',
    date: 'Mar 10, 2025',
    contact: 'Mike Johnson',
    engagement: '78%',
    price: '$4,500',
  },
];

export function PropertyTable() {
  return (
    <Card className="bg-white border-slate-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Active Property</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="border-slate-200">
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search property"
              className="pl-10 border-slate-200 bg-slate-50 text-sm"
            />
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs md:text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-2 font-medium text-slate-600">Property</th>
                  <th className="text-left py-3 px-2 font-medium text-slate-600">Location</th>
                  <th className="text-left py-3 px-2 font-medium text-slate-600">Date</th>
                  <th className="text-left py-3 px-2 font-medium text-slate-600">Contact</th>
                  <th className="text-left py-3 px-2 font-medium text-slate-600">Engagement</th>
                  <th className="text-left py-3 px-2 font-medium text-slate-600">Price</th>
                  <th className="text-left py-3 px-2 font-medium text-slate-600">Action</th>
                </tr>
              </thead>
              <tbody>
                {properties.map((property) => (
                  <tr key={property.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-2 text-slate-900 font-medium">{property.name}</td>
                    <td className="py-3 px-2 text-slate-600">{property.location}</td>
                    <td className="py-3 px-2 text-slate-600">{property.date}</td>
                    <td className="py-3 px-2 text-slate-600">{property.contact}</td>
                    <td className="py-3 px-2 text-slate-600">{property.engagement}</td>
                    <td className="py-3 px-2 text-slate-900 font-medium">{property.price}</td>
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
        </div>
      </CardContent>
    </Card>
  );
}
