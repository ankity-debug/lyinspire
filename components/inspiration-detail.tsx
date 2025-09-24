'use client';

import { useState, useEffect } from 'react';
import { Inspiration } from '@/types/inspiration';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LoadingSkeleton } from '@/components/loading-skeleton';
import { ExternalLink, Heart, Eye, MessageCircle, Calendar, User, Tag } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface InspirationDetailProps {
  id: string;
}

export function InspirationDetail({ id }: InspirationDetailProps) {
  const [inspiration, setInspiration] = useState<Inspiration | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInspiration = async () => {
      try {
        const response = await fetch(`/api/inspirations/${id}`);
        
        if (response.status === 404) {
          notFound();
        }
        
        if (!response.ok) {
          throw new Error('Failed to fetch inspiration');
        }
        
        const data = await response.json();
        setInspiration(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchInspiration();
  }, [id]);

  if (isLoading) return <LoadingSkeleton className="h-96" />;
  
  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">Error: {error}</p>
        <Button asChild>
          <Link href="/archive">Back to Archive</Link>
        </Button>
      </div>
    );
  }
  
  if (!inspiration) return notFound();

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Badge variant="secondary">{inspiration.platform}</Badge>
          <Badge variant="outline">
            <Calendar className="w-3 h-3 mr-1" />
            {new Date(inspiration.publishedAt).toLocaleDateString()}
          </Badge>
        </div>
        
        <h1 className="text-3xl md:text-4xl font-bold leading-tight">
          {inspiration.title}
        </h1>
        
        {inspiration.description && (
          <p className="text-lg text-muted-foreground">
            {inspiration.description}
          </p>
        )}
      </div>

      {/* Image */}
      <div className="relative">
        <div className="aspect-video overflow-hidden rounded-xl bg-muted">
          <Image
            src={inspiration.thumbnailUrl || '/api/placeholder/800/450'}
            alt={inspiration.title}
            width={800}
            height={450}
            className="object-cover w-full h-full"
          />
        </div>
      </div>

      {/* Metadata */}
      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-6">
          {inspiration.authorName && (
            <div className="flex items-center space-x-3">
              <User className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Created by</p>
                {inspiration.authorUrl ? (
                  <a
                    href={inspiration.authorUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {inspiration.authorName}
                  </a>
                ) : (
                  <p className="text-muted-foreground">{inspiration.authorName}</p>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center space-x-6 text-muted-foreground">
            {inspiration.sourceMeta?.likes && (
              <div className="flex items-center space-x-2">
                <Heart className="w-4 h-4" />
                <span>{inspiration.sourceMeta.likes.toLocaleString()} likes</span>
              </div>
            )}
            {inspiration.sourceMeta?.views && (
              <div className="flex items-center space-x-2">
                <Eye className="w-4 h-4" />
                <span>{inspiration.sourceMeta.views.toLocaleString()} views</span>
              </div>
            )}
            {inspiration.sourceMeta?.comments && (
              <div className="flex items-center space-x-2">
                <MessageCircle className="w-4 h-4" />
                <span>{inspiration.sourceMeta.comments} comments</span>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Tag className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">Tags</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {inspiration.tags.map((tag) => (
                <Badge key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-6 bg-card rounded-lg border">
            <h3 className="font-semibold mb-4">Inspiration Score</h3>
            <div className="text-3xl font-bold text-primary mb-2">
              {Math.round(inspiration.score)}
            </div>
            <p className="text-sm text-muted-foreground">
              Based on engagement, quality, and recency
            </p>
          </div>

          <div className="space-y-3">
            <Button asChild className="w-full" size="lg">
              <a
                href={inspiration.contentUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                View Original on {inspiration.platform}
              </a>
            </Button>
            
            <Button asChild variant="outline" className="w-full">
              <Link href="/archive">Back to Archive</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}