import { Suspense } from 'react';
import { ArchiveFilters } from '@/components/archive-filters';
import { ArchiveGrid } from '@/components/archive-grid';
import { SearchBar } from '@/components/search-bar';
import { LoadingSkeleton } from '@/components/loading-skeleton';

interface ArchivePageProps {
  searchParams: {
    search?: string;
    platform?: string;
    tags?: string;
    date?: string;
    page?: string;
  };
}

export default function ArchivePage({ searchParams }: ArchivePageProps) {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-4">Design Archive</h1>
        <p className="text-muted-foreground mb-6">
          Explore our complete collection of curated design inspirations
        </p>
        
        <div className="space-y-6">
          <SearchBar defaultValue={searchParams.search} />
          <ArchiveFilters searchParams={searchParams} />
        </div>
      </div>
      
      <Suspense fallback={<LoadingSkeleton className="h-96" />}>
        <ArchiveGrid searchParams={searchParams} />
      </Suspense>
    </div>
  );
}