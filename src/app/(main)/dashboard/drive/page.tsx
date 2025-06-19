import { Suspense } from 'react';
import { DriveManager } from './_components/drive-manager';
import { DriveManagerSkeleton } from './_components/drive-manager-skeleton';

export default function DrivePage() {
  return (
    <div className="flex-1 space-y-6 p-6">
      
      
      <Suspense fallback={<DriveManagerSkeleton />}>
        <DriveManager />
      </Suspense>
    </div>
  );
}