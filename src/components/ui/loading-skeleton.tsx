import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

interface LoadingSkeletonProps {
  count?: number;
  type?: 'grid' | 'list' | 'table';
}

export function LoadingSkeleton({ count = 8, type = 'grid' }: LoadingSkeletonProps) {
  if (type === 'grid') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
        {Array.from({ length: count }).map((_, i) => (
          <Card key={i} className="group hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <Skeleton className="h-12 w-12 rounded" />
                <Skeleton className="h-8 w-8 rounded" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (type === 'list') {
    return (
      <div className="space-y-2">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex items-center space-x-4 p-4 rounded-lg border">
            <Skeleton className="h-10 w-10 rounded" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-1/4" />
            </div>
            <Skeleton className="h-8 w-8 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (type === 'table') {
    return (
      <div className="space-y-2">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex items-center space-x-4 p-4 border-b">
            <Skeleton className="h-6 w-6" />
            <Skeleton className="h-8 w-8 rounded" />
            <div className="flex-1">
              <Skeleton className="h-4 w-1/3" />
            </div>
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-8 rounded" />
          </div>
        ))}
      </div>
    );
  }

  return null;
}

export function BreadcrumbLoadingSkeleton() {
  return (
    <div className="flex items-center space-x-2 mb-4">
      <Skeleton className="h-4 w-16" />
      <span className="text-muted-foreground">/</span>
      <Skeleton className="h-4 w-20" />
      <span className="text-muted-foreground">/</span>
      <Skeleton className="h-4 w-24" />
    </div>
  );
}