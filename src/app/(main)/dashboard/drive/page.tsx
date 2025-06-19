import { Suspense } from 'react';
import { DriveManager } from './_components/drive-manager';
import { DriveManagerSkeleton } from './_components/drive-manager-skeleton';

export default function DrivePage() {
  return (
    <div className="w-full min-h-screen">
      <Suspense fallback={<DriveManagerSkeleton />}>
        <DriveManager />
      </Suspense>
    </div>
  );
}