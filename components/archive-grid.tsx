'use client';

import { useState, useEffect } from 'react';
import { InspirationCard } from '@/components/inspiration-card';
import { LoadingSkeleton } from '@/components/loading-skeleton';
import { Button } from '@/components/ui/button';
import { Inspiration, PaginatedResponse } from '@/types/inspiration';

interface ArchiveGridProps {
  searchParams: {
    search?: string;
    platform?: string;
    tags?: string;
    date?: string;
    page?: string;
  };
}

export function ArchiveGrid({ searchParams }: ArchiveGridProps) {
  const [data, setData] = useState<PaginatedResponse<Inspiration> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInspirations = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const params = new URLSearchParams();
        if (searchParams.search) params.set('search', searchParams.search);
        if (searchParams.platform) params.set('platform', searchParams.platform);
        if (searchParams.tags) params.set('tags', searchParams.tags);
        if (searchParams.date) params.set('date', searchParams.date);
        if (searchParams.page) params.set('page', searchParams.page);
        
        const response = await fetch(`/api/inspirations?${params.toString()}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch inspirations');
        }
        
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchInspirations();
  }, [searchParams]);

  if (isLoading) return <LoadingSkeleton cards={12} />;
  
  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">Error: {error}</p>
        <Button onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    );
  }
  
  if (!data || data.data.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">No inspirations found</p>
        <Button asChild>
          <a href="/archive">Clear Filters</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {data.data.map((inspiration) => (
          <InspirationCard key={inspiration.id} inspiration={inspiration} />
        ))}
      </div>
      
      {data.totalPages > 1 && (
        <div className="flex justify-center items-center space-x-4">
          <div className="text-sm text-muted-foreground">
            Page {data.page} of {data.totalPages} ({data.total} total)
          </div>
          <div className="flex space-x-2">
            {data.page > 1 && (
              <Button variant="outline" asChild>
                <a href={`/archive?${new URLSearchParams({ ...searchParams, page: String(data.page - 1) }).toString()}`}>
                  Previous
                </a>
              </Button>
            )}
            {data.hasMore && (
              <Button asChild>
                <a href={`/archive?${new URLSearchParams({ ...searchParams, page: String(data.page + 1) }).toString()}`}>
                  Next
                </a>
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}