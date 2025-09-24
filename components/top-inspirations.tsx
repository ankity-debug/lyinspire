'use client';

import { useEffect, useState } from 'react';
import { getTodayData } from '@/lib/mock-data';
import { Inspiration } from '@/types/inspiration';
import { InspirationCard } from '@/components/inspiration-card';
import { TrendingUp } from 'lucide-react';

export function TopInspirations() {
  const [inspirations, setInspirations] = useState<Inspiration[]>([]);

  useEffect(() => {
    const data = getTodayData();
    setInspirations(data.top10);
  }, []);

  return (
    <section className="space-y-6">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
          <TrendingUp className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Top 10 Inspirations</h2>
          <p className="text-muted-foreground">Trending designs from the community</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {inspirations.map((inspiration, index) => (
          <InspirationCard 
            key={inspiration.id} 
            inspiration={inspiration}
            rank={index + 1}
            showRank
          />
        ))}
      </div>
    </section>
  );
}