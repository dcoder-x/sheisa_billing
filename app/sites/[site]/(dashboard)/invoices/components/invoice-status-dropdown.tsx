'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ChevronDown, Loader2 } from 'lucide-react';

const statuses = ['PENDING', 'PAID', 'OVERDUE', 'CANCELLED'];

export function InvoiceStatusDropdown({ invoiceId, currentStatus }: { invoiceId: string; currentStatus: string }) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === currentStatus) return;
    
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/invoices/${invoiceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) throw new Error('Failed to update status');

      toast.success(`Status updated to ${newStatus}`);
      router.refresh();
    } catch (error) {
      console.error('Status update failed:', error);
      toast.error('Failed to update status');
    } finally {
      setIsUpdating(false);
    }
  };

  const currentStyles = getStatusStyles(currentStatus);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className={`h-7 text-xs font-medium px-2.5 rounded-full border ${currentStyles.button} ${isUpdating ? 'opacity-50' : ''}`}
          disabled={isUpdating}
        >
          {isUpdating && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
          {currentStatus.charAt(0) + currentStatus.slice(1).toLowerCase()}
          <ChevronDown className="w-3 h-3 ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[140px]">
        {statuses.map(status => (
          <DropdownMenuItem 
            key={status}
            onClick={() => handleStatusChange(status)}
            className="text-xs py-1.5 cursor-pointer"
          >
            <div className={`w-2 h-2 rounded-full mr-2 ${getStatusStyles(status).dot}`} />
            {status.charAt(0) + status.slice(1).toLowerCase()}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function getStatusStyles(status: string) {
  switch (status) {
    case 'PENDING':
      return { button: 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100', dot: 'bg-orange-500' };
    case 'PAID':
      return { button: 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100', dot: 'bg-green-500' };
    case 'OVERDUE':
      return { button: 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100', dot: 'bg-red-500' };
    case 'CANCELLED':
      return { button: 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100', dot: 'bg-slate-500' };
    default:
      return { button: 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100', dot: 'bg-slate-500' };
  }
}
