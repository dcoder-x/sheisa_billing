'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Search, Loader2, Trash2, Ban, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Entity {
  id: string;
  name: string;
  regNumber: string;
  email: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  users: number;
  invoicesCount: number;
  revenue: number;
  createdAt: string;
}

export function EntitiesTable() {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchEntities = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/entities?search=${encodeURIComponent(search)}`);
      if (res.ok) {
        const data = await res.json();
        setEntities(data);
      } else {
        toast.error('Failed to fetch entities');
      }
    } catch (error) {
      console.error(error);
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
        fetchEntities();
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/entities/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        toast.success(`Entity status updated to ${newStatus}`);
        fetchEntities();
      } else {
        toast.error('Failed to update status');
      }
    } catch (error) {
       toast.error('An error occurred');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this entity? This action cannot be undone.')) return;

    try {
      const res = await fetch(`/api/admin/entities/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success('Entity deleted');
        fetchEntities();
      } else {
        toast.error('Failed to delete entity');
      }
    } catch (error) {
        toast.error('An error occurred');
    }
  };

  const getStatusColor = (status: string) => {
      switch(status) {
          case 'ACTIVE': return 'bg-green-100 text-green-700';
          case 'SUSPENDED': return 'bg-red-100 text-red-700';
          case 'INACTIVE': return 'bg-slate-100 text-slate-700';
          default: return 'bg-slate-100 text-slate-700';
      }
  };

  return (
    <Card className="bg-white border-slate-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Entity Management</CardTitle>
            <CardDescription>Manage all registered entities on the platform</CardDescription>
          </div>
          {/* Add Entity logic could be here, but usually registration is self-service or via Requests page */}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search by name, email, or reg number..."
              className="pl-10 border-slate-200 bg-slate-50"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-medium text-slate-600">Entity Name</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-600">Reg. Number</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-600">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-600">Revenue</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-600">Users</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-600">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                    <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-500">
                            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2"/>
                            Loading entities...
                        </td>
                    </tr>
                ) : entities.length === 0 ? (
                    <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-500">
                            No entities found.
                        </td>
                    </tr>
                ) : (
                    entities.map((entity) => (
                    <tr key={entity.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-3 px-4">
                            <div className="font-medium text-slate-900">{entity.name}</div>
                            <div className="text-xs text-slate-500">{entity.email}</div>
                        </td>
                        <td className="py-3 px-4 text-slate-600">{entity.regNumber}</td>
                        <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(entity.status)}`}>
                            {entity.status}
                        </span>
                        </td>
                        <td className="py-3 px-4 text-slate-900 font-medium">
                            ${entity.revenue.toLocaleString()}
                            <div className="text-xs text-slate-500">{entity.invoicesCount} invoices</div>
                        </td>
                        <td className="py-3 px-4 text-slate-600">{entity.users}</td>
                        <td className="py-3 px-4">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                        <MoreHorizontal className="w-4 h-4 text-slate-600" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                    <DropdownMenuItem onClick={() => handleStatusChange(entity.id, 'ACTIVE')}>
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        Activate
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleStatusChange(entity.id, 'SUSPENDED')}>
                                        <Ban className="w-4 h-4 mr-2" />
                                        Suspend
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem 
                                        onClick={() => handleDelete(entity.id)}
                                        className="text-red-600 focus:text-red-600"
                                    >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Delete
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </td>
                    </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
