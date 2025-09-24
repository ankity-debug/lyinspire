'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  defaultValue?: string;
}

export function SearchBar({ defaultValue = '' }: SearchBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(defaultValue);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    
    if (query.trim()) {
      params.set('search', query.trim());
    } else {
      params.delete('search');
    }
    
    params.delete('page'); // Reset to first page
    router.push(`/archive?${params.toString()}`);
  };

  const clearSearch = () => {
    setQuery('');
    const params = new URLSearchParams(searchParams);
    params.delete('search');
    params.delete('page');
    router.push(`/archive?${params.toString()}`);
  };

  return (
    <form onSubmit={handleSearch} className="relative max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          type="text"
          placeholder="Search inspirations..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 pr-20"
        />
        {query && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearSearch}
            className="absolute right-12 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
          >
            <X className="w-3 h-3" />
          </Button>
        )}
        <Button type="submit" size="sm" className="absolute right-1 top-1/2 transform -translate-y-1/2">
          Search
        </Button>
      </div>
    </form>
  );
}