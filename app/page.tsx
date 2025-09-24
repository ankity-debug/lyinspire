import { Suspense } from 'react';
import { AwardPick } from '@/components/award-pick';
import { TopInspirations } from '@/components/top-inspirations';
import { HeroSection } from '@/components/hero-section';
import { LoadingSkeleton } from '@/components/loading-skeleton';

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-12">
      <HeroSection />
      
      <Suspense fallback={<LoadingSkeleton className="h-96" />}>
        <AwardPick />
      </Suspense>
      
      <Suspense fallback={<LoadingSkeleton className="h-64" />}>
        <TopInspirations />
      </Suspense>
    </div>
  );
}