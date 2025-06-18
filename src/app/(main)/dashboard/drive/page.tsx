import { Suspense } from 'react';
import { DriveManager } from './_components/drive-manager';
import { DriveManagerSkeleton } from './_components/drive-manager-skeleton';

export default function DrivePage() {
  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Professional Google Drive Management</h1>
          <p className="text-muted-foreground">
            Professional file management solution for enterprise Google Drive operations
          </p>
        </div>
      </div>
      
      <Suspense fallback={<DriveManagerSkeleton />}>
        <DriveManager />
      </Suspense>
    </div>
  );
}