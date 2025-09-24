'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface ArchiveFiltersProps {
  searchParams: {
    search?: string;
    platform?: string;
    tags?: string;
    date?: string;
    page?: string;
  };
}

const platforms = ['Behance', 'Dribbble', 'Medium', 'Core77', 'Awwwards'];
const popularTags = [
  'UI Design', 'Web Design', 'Mobile App', 'Branding', 'Typography',
  'Illustration', 'Photography', 'Product Design', 'UX Research', 'Animation'
];

export function ArchiveFilters({ searchParams }: ArchiveFiltersProps) {
  const router = useRouter();
  const params = useSearchParams();

  const updateFilter = (key: string, value: string | null) => {
    const newParams = new URLSearchParams(params);
    
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    
    newParams.delete('page'); // Reset pagination
    router.push(`/archive?${newParams.toString()}`);
  };

  const clearAllFilters = () => {
    router.push('/archive');
  };

  const activeFilters = [
    searchParams.platform && { key: 'platform', value: searchParams.platform, label: searchParams.platform },
    searchParams.tags && { key: 'tags', value: searchParams.tags, label: searchParams.tags },
    searchParams.date && { key: 'date', value: searchParams.date, label: searchParams.date },
  ].filter(Boolean);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4">
        <Select value={searchParams.platform || ''} onValueChange={(value) => updateFilter('platform', value || null)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Platform" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Platforms</SelectItem>
            {platforms.map((platform) => (
              <SelectItem key={platform} value={platform}>
                {platform}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={searchParams.date || ''} onValueChange={(value) => updateFilter('date', value || null)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Date" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Time</SelectItem>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="year">This Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">Popular Tags:</p>
        <div className="flex flex-wrap gap-2">
          {popularTags.map((tag) => (
            <Badge
              key={tag}
              variant={searchParams.tags?.includes(tag) ? 'default' : 'outline'}
              className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
              onClick={() => {
                const currentTags = searchParams.tags?.split(',') || [];
                const newTags = currentTags.includes(tag)
                  ? currentTags.filter(t => t !== tag)
                  : [...currentTags, tag];
                
                updateFilter('tags', newTags.length > 0 ? newTags.join(',') : null);
              }}
            >
              {tag}
            </Badge>
          ))}
        </div>
      </div>

      {activeFilters.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {activeFilters.map((filter) => (
            <Badge key={filter!.key} variant="secondary" className="gap-1">
              {filter!.label}
              <Button
                variant="ghost"
                size="sm"
                className="h-3 w-3 p-0 hover:bg-transparent"
                onClick={() => updateFilter(filter!.key, null)}
              >
                <X className="h-2 w-2" />
              </Button>
            </Badge>
          ))}
          <Button variant="ghost" size="sm" onClick={clearAllFilters} className="h-6">
            Clear all
          </Button>
        </div>
      )}
    </div>
  );
}