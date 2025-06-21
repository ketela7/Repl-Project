import { DriveToolbarSkeleton, DriveSearchSkeleton, DriveBreadcrumbSkeleton } from '@/components/ui/loading-skeleton';
import { DriveGridSkeleton } from './drive-skeleton';

export function DriveManagerSkeleton() {
  return (
    <div className="w-full space-y-3 sm:space-y-4">
      <DriveToolbarSkeleton />
      <DriveSearchSkeleton />
      <DriveBreadcrumbSkeleton />
      <div className="px-2 sm:px-0">
        <DriveGridSkeleton />
      </div>
    </div>
  );
}