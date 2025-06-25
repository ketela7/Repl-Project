import { Skeleton } from "@/components/ui/skeleton";

// Drive-specific toolbar skeleton for consistent loading states
export function DriveToolbarSkeleton() {
  return (
    <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b shadow-sm">
      <div className="flex items-center justify-between p-3 md:p-4">
        <div className="flex items-center gap-2 md:gap-3">
          <Skeleton className="h-8 w-16 rounded-md" />
          <Skeleton className="h-8 w-16 rounded-md" />
          <Skeleton className="h-8 w-16 rounded-md" />
          <Skeleton className="h-8 w-16 rounded-md" />
          <Skeleton className="h-8 w-16 rounded-md" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>
      </div>
    </div>
  );
}

// Drive-specific search skeleton
export function DriveSearchSkeleton() {
  return (
    <div className="px-2 sm:px-0">
      <Skeleton className="h-10 rounded-md" />
    </div>
  );
}

// Drive-specific breadcrumb skeleton
export function DriveBreadcrumbSkeleton() {
  return (
    <div className="px-2 sm:px-0">
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-12 rounded" />
        <Skeleton className="h-4 w-4 rounded" />
        <Skeleton className="h-4 w-20 rounded" />
      </div>
    </div>
  );
}

