'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useDebouncedCallback } from 'use-debounce';
import { useTransition } from 'react';

export function SearchInput({ placeholder = 'Search...' }: { placeholder?: string }) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleSearch = useDebouncedCallback((term: string) => {
    const params = new URLSearchParams(searchParams.toString());
    
    // Reset to page 1 on new search
    params.set('page', '1');
    
    if (term) {
      params.set('q', term);
    } else {
      params.delete('q');
    }
    
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`);
    });
  }, 300);

  return (
    <div className="relative flex flex-1 max-w-sm">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
      <Input
        placeholder={placeholder}
        className="pl-10 pr-10 border-slate-200 bg-slate-50"
        defaultValue={searchParams.get('q')?.toString() || ''}
        onChange={(e) => handleSearch(e.target.value)}
      />
      {isPending && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
        </div>
      )}
    </div>
  );
}
