import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface LoadingSkeletonProps {
  className?: string;
  cards?: number;
}

export function LoadingSkeleton({ className, cards = 8 }: LoadingSkeletonProps) {
  return (
    <div className={cn("space-y-6", className)}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: cards }).map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="aspect-[4/3] w-full" />
            <div className="space-y-2 p-4">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <div className="flex space-x-2">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-16" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}