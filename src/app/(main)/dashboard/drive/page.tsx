"use client";

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { DriveManagerSkeleton } from './_components/drive-manager-skeleton';
import { TouchAuditPanel } from '@/components/ui/touch-audit';

// Lazy load the heavy DriveManager component with optimized loading
const DriveManager = dynamic(() => import('./_components/drive-manager').then(mod => ({ default: mod.DriveManager })), {
  loading: () => <DriveManagerSkeleton />,
  ssr: false
});

export default function DrivePage() {
  return (
    <div className="w-full min-h-screen">
      <Suspense fallback={<DriveManagerSkeleton />}>
        <DriveManager />
      </Suspense>
      <TouchAuditPanel />
    </div>
  );
}