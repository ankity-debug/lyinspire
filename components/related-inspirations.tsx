'use client';

import { useState, useEffect } from 'react';
import { InspirationCard } from '@/components/inspiration-card';
import { LoadingSkeleton } from '@/components/loading-skeleton';
import { Inspiration } from '@/types/inspiration';

interface RelatedInspirationsProps {
  id: string;
}

export function RelatedInspirations({ id }: RelatedInspirationsProps) {
  const [inspirations, setInspirations] = useState<Inspiration[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRelated = async () => {
      try {
        const response = await fetch(`/api/inspirations/${id}/related`);
        if (response.ok) {
          const data = await response.json();
          setInspirations(data);
        }
      } catch (error) {
        console.error('Failed to fetch related inspirations:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRelated();
  }, [id]);

  if (isLoading) return <LoadingSkeleton cards={6} />;
  
  if (inspirations.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {inspirations.map((inspiration) => (
        <InspirationCard key={inspiration.id} inspiration={inspiration} />
      ))}
    </div>
  );
}