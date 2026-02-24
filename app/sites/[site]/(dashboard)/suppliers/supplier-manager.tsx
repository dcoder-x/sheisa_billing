'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Papa from 'papaparse';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, MoreHorizontal, Loader2, UploadCloud } from 'lucide-react';
import { toast } from 'sonner';
import { SearchInput } from '@/components/ui/search-input';
import { PaginationControls } from '@/components/ui/pagination-controls';

interface Supplier {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  _count?: {
    invoices: number;
  };
}

interface SupplierManagerProps {
  initialSuppliers: Supplier[];
  totalItems: number;
  pageSize: number;
}

export function SupplierManager({ initialSuppliers, totalItems, pageSize }: SupplierManagerProps) {
  const router = useRouter();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newSupplier, setNewSupplier] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    bankAccount: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results: any) => {
        try {
          // Map to expected fields based on CSV headers (flexible)
          const parsedSuppliers = results.data.map((row: any) => {
             // Try to find columns case-insensitively
             const getField = (keys: string[]) => {
                const key = Object.keys(row).find(k => keys.includes(k.toLowerCase().trim()));
                return key ? row[key] : '';
             };

             return {
               name: getField(['name', 'supplier name', 'company', 'company name']),
               email: getField(['email', 'email address']),
               phone: getField(['phone', 'phone number', 'contact']),
               address: getField(['address', 'billing address']),
               bankAccount: getField(['bank account', 'account', 'bank']),
             };
          }).filter((s: any) => s.name && s.email);

          if (parsedSuppliers.length === 0) {
            toast.error('No valid suppliers found. Please ensure your CSV has Name and Email columns.');
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
          }

          const res = await fetch('/api/suppliers/bulk', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ suppliers: parsedSuppliers }),
          });

          if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || 'Failed to import suppliers');
          }

          const data = await res.json();
          toast.success(data.message || `Successfully imported ${parsedSuppliers.length} suppliers!`);
          router.refresh();
        } catch (error: any) {
          console.error('Import error:', error);
          toast.error(error.message || 'An error occurred during import');
        } finally {
          setIsUploading(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      },
      error: (error: Error) => {
        console.error('PapaParse error:', error);
        toast.error('Failed to parse the CSV file.');
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    });
  };

  const handleAddSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSupplier),
      });

      if (!res.ok) {
        const errorData = await res.json();
        toast.error(errorData.message || 'Failed to add supplier');
        return;
      }

      setIsAddOpen(false);
      setNewSupplier({ name: '', email: '', phone: '', address: '', bankAccount: '' });
      toast.success('Supplier added successfully');
      
      // Hit the server to retrieve the newest list
      router.refresh(); 
    } catch (error) {
      console.error('Error adding supplier:', error);
      toast.error('An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Suppliers</h1>
          <p className="text-slate-600 mt-2">Manage your supplier relationships</p>
        </div>
        <div className="flex gap-3">
          <input 
            type="file" 
            accept=".csv" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
          />
          {/* CSV Import Dialog */}
          <Dialog>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                className="gap-2" 
                disabled={isUploading}
              >
                {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                Import CSV
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px]">
              <DialogHeader>
                <DialogTitle>Import Suppliers from CSV</DialogTitle>
                <DialogDescription>
                  Upload a CSV file to bulk import suppliers. Your file must include a header row with the exact column names below.
                </DialogDescription>
              </DialogHeader>
              
              <div className="py-4 space-y-4">
                <div>
                  <h4 className="font-semibold text-sm mb-2 text-slate-800">Required Fields:</h4>
                  <p className="text-sm text-slate-600 mb-2">
                    <code className="bg-slate-100 px-1 py-0.5 rounded text-primary">name</code> (Required)<br/>
                    <code className="bg-slate-100 px-1 py-0.5 rounded text-primary">email</code> (Optional)<br/>
                    <code className="bg-slate-100 px-1 py-0.5 rounded text-primary">phone</code> (Optional)<br/>
                    <code className="bg-slate-100 px-1 py-0.5 rounded text-primary">status</code> (Optional, defaults to ACTIVE. Valid values: ACTIVE, INACTIVE)
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-sm mb-2 text-slate-800">Example CSV Format:</h4>
                  <div className="bg-slate-50 border border-slate-200 rounded-md overflow-x-auto">
                    <table className="w-full text-sm text-left text-slate-600">
                      <thead className="bg-slate-100 text-slate-700 font-mono text-xs">
                        <tr>
                          <th className="px-3 py-2 border-b">name</th>
                          <th className="px-3 py-2 border-b">email</th>
                          <th className="px-3 py-2 border-b">phone</th>
                          <th className="px-3 py-2 border-b">status</th>
                        </tr>
                      </thead>
                      <tbody className="font-mono text-xs">
                        <tr>
                          <td className="px-3 py-2 border-b">Acme Corp</td>
                          <td className="px-3 py-2 border-b">billing@acmecorp.com</td>
                          <td className="px-3 py-2 border-b">+1-555-0198</td>
                          <td className="px-3 py-2 border-b">ACTIVE</td>
                        </tr>
                        <tr>
                          <td className="px-3 py-2">Global Supplies</td>
                          <td className="px-3 py-2">info@globalsup.net</td>
                          <td className="px-3 py-2"></td>
                          <td className="px-3 py-2"></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button variant="outline" onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="gap-2"
                  >
                    Select CSV File
                  </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
              <Plus className="w-4 h-4" />
              Add Supplier
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Supplier</DialogTitle>
              <DialogDescription>
                Enter the details of the supplier you want to add.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddSupplier} className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={newSupplier.name}
                  onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newSupplier.email}
                  onChange={(e) => setNewSupplier({ ...newSupplier, email: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={newSupplier.phone}
                  onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={newSupplier.address}
                  onChange={(e) => setNewSupplier({ ...newSupplier, address: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="bankAccount">Bank Account (Optional)</Label>
                <Input
                  id="bankAccount"
                  value={newSupplier.bankAccount}
                  onChange={(e) => setNewSupplier({ ...newSupplier, bankAccount: e.target.value })}
                />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    'Add Supplier'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <Card className="bg-white border-slate-200">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle>All Suppliers</CardTitle>
              <CardDescription>{totalItems} suppliers total</CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <SearchInput placeholder="Search suppliers..." />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Invoices</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {initialSuppliers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                        No suppliers found matching your criteria.
                      </TableCell>
                    </TableRow>
                  ) : (
                    initialSuppliers.map((supplier) => (
                      <TableRow key={supplier.id}>
                        <TableCell className="font-medium">{supplier.name}</TableCell>
                        <TableCell>{supplier.email}</TableCell>
                        <TableCell>{supplier.phone}</TableCell>
                        <TableCell>
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {supplier.status}
                          </span>
                        </TableCell>
                        <TableCell>{supplier._count?.invoices || 0}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="w-4 h-4 text-slate-600" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            
            <PaginationControls totalItems={totalItems} pageSize={pageSize} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
