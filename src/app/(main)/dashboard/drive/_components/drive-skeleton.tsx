import { Skeleton } from '@/components/ui/skeleton'

export function BreadcrumbSkeleton() {
  return (
    <div className="mb-4 flex items-center space-x-2">
      <Skeleton className="h-4 w-16" />
      <span className="text-muted-foreground">/</span>
      <Skeleton className="h-4 w-20" />
      <span className="text-muted-foreground">/</span>
      <Skeleton className="h-4 w-24" />
    </div>
  )
}

// DriveGridSkeleton removed - replaced with SkeletonTable for better consistency
