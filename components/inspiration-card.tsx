'use client';

import { Inspiration } from '@/types/inspiration';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Heart, Eye, MessageCircle, ExternalLink, Trophy } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface InspirationCardProps {
  inspiration: Inspiration;
  rank?: number;
  showRank?: boolean;
  className?: string;
}

export function InspirationCard({ 
  inspiration, 
  rank, 
  showRank = false, 
  className 
}: InspirationCardProps) {
  return (
    <Card className={cn("group overflow-hidden hover:shadow-lg transition-all duration-300", className)}>
      <div className="relative">
        {showRank && rank && (
          <div className="absolute top-3 left-3 z-10">
            <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full text-white font-bold text-sm shadow-lg">
              {rank === 1 ? <Trophy className="w-4 h-4" /> : rank}
            </div>
          </div>
        )}
        
        <div className="aspect-[4/3] overflow-hidden bg-muted">
          <Image
            src={inspiration.thumbnailUrl || '/api/placeholder/400/300'}
            alt={inspiration.title}
            width={400}
            height={300}
            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
          />
        </div>
        
        {inspiration.authorName && (
          <div className="absolute bottom-3 left-3 bg-background/95 backdrop-blur-sm rounded-md px-2 py-1">
            <p className="text-xs font-medium text-foreground">{inspiration.authorName}</p>
          </div>
        )}
      </div>
      
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <Badge variant="secondary" className="text-xs">
            {inspiration.platform}
          </Badge>
          <div className="text-xs text-muted-foreground">
            {new Date(inspiration.publishedAt).toLocaleDateString()}
          </div>
        </div>
        
        <h3 className="font-semibold leading-tight line-clamp-2 group-hover:text-primary transition-colors">
          {inspiration.title}
        </h3>
        
        {inspiration.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {inspiration.description}
          </p>
        )}
        
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center space-x-3">
            {inspiration.sourceMeta?.likes && (
              <div className="flex items-center space-x-1">
                <Heart className="w-3 h-3" />
                <span>{inspiration.sourceMeta.likes}</span>
              </div>
            )}
            {inspiration.sourceMeta?.views && (
              <div className="flex items-center space-x-1">
                <Eye className="w-3 h-3" />
                <span>{inspiration.sourceMeta.views}</span>
              </div>
            )}
            {inspiration.sourceMeta?.comments && (
              <div className="flex items-center space-x-1">
                <MessageCircle className="w-3 h-3" />
                <span>{inspiration.sourceMeta.comments}</span>
              </div>
            )}
          </div>
          
          <div className="text-xs font-medium text-primary">
            Score: {Math.round(inspiration.score)}
          </div>
        </div>
        
        <div className="flex flex-wrap gap-1">
          {inspiration.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs px-2 py-0">
              {tag}
            </Badge>
          ))}
          {inspiration.tags.length > 3 && (
            <Badge variant="outline" className="text-xs px-2 py-0">
              +{inspiration.tags.length - 3}
            </Badge>
          )}
        </div>
        
        <div className="flex items-center space-x-2 pt-2">
          <Button asChild size="sm" className="flex-1">
            <Link href={`/inspiration/${inspiration.id}`}>
              View Details
            </Link>
          </Button>
          
          <Button variant="outline" size="sm" asChild>
            <a href={inspiration.contentUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-3 h-3" />
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}