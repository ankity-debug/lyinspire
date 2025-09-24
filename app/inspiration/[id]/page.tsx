import { Suspense } from 'react';
import { InspirationDetail } from '@/components/inspiration-detail';
import { RelatedInspirations } from '@/components/related-inspirations';
import { LoadingSkeleton } from '@/components/loading-skeleton';
import { notFound } from 'next/navigation';

interface InspirationPageProps {
  params: {
    id: string;
  };
}

export default function InspirationPage({ params }: InspirationPageProps) {
  return (
    <div className="container mx-auto px-4 py-8">
      <Suspense fallback={<LoadingSkeleton className="h-96" />}>
        <InspirationDetail id={params.id} />
      </Suspense>
      
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6">Related Inspirations</h2>
        <Suspense fallback={<LoadingSkeleton className="h-64" />}>
          <RelatedInspirations id={params.id} />
        </Suspense>
      </div>
    </div>
  );
}