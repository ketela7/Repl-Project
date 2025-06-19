import { Suspense } from 'react';
import { DriveManagerClean } from './_components/drive-manager-clean';
import { DriveManagerSkeleton } from './_components/drive-manager-skeleton';

export default function DrivePage() {
  return (
    <div className="w-full min-h-screen">
      <Suspense fallback={<DriveManagerSkeleton />}>
        <DriveManagerClean />
      </Suspense>
    </div>
  );
}