'use client';

import { useEffect, useState } from 'react';
import { getTodayData } from '@/lib/mock-data';
import { Inspiration } from '@/types/inspiration';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Award, ExternalLink, Heart, Eye, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export function AwardPick() {
  const [awardPick, setAwardPick] = useState<Inspiration | null>(null);

  useEffect(() => {
    const data = getTodayData();
    setAwardPick(data.awardPick);
  }, []);

  if (!awardPick) return null;

  return (
    <section className="space-y-6">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl flex items-center justify-center">
          <Award className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Today's Award Pick</h2>
          <p className="text-muted-foreground">Our editors' choice for exceptional design</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8 p-6 md:p-8 bg-card rounded-2xl border shadow-sm">
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Badge variant="secondary">{awardPick.platform}</Badge>
              <Badge variant="outline">Editor's Choice</Badge>
            </div>
            
            <h3 className="text-2xl md:text-3xl font-bold leading-tight">
              {awardPick.title}
            </h3>
            
            <p className="text-muted-foreground leading-relaxed">
              {awardPick.description}
            </p>
          </div>

          <div className="flex items-center space-x-6 text-sm text-muted-foreground">
            <div className="flex items-center space-x-2">
              <Heart className="w-4 h-4" />
              <span>{awardPick.sourceMeta?.likes || 0}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Eye className="w-4 h-4" />
              <span>{awardPick.sourceMeta?.views || 0}</span>
            </div>
            <div className="flex items-center space-x-2">
              <MessageCircle className="w-4 h-4" />
              <span>{awardPick.sourceMeta?.comments || 0}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {awardPick.tags.slice(0, 4).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>

          <div className="flex items-center space-x-4">
            <Button asChild>
              <Link href={`/inspiration/${awardPick.id}`}>
                View Details
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <a href={awardPick.contentUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-2" />
                Original
              </a>
            </Button>
          </div>
        </div>

        <div className="relative group">
          <div className="aspect-[4/3] overflow-hidden rounded-xl bg-muted">
            <Image
              src={awardPick.thumbnailUrl || '/api/placeholder/600/450'}
              alt={awardPick.title}
              width={600}
              height={450}
              className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
            />
          </div>
          
          {awardPick.authorName && (
            <div className="absolute bottom-4 left-4 bg-background/95 backdrop-blur-sm rounded-lg px-3 py-2">
              <p className="text-sm font-medium">by {awardPick.authorName}</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}