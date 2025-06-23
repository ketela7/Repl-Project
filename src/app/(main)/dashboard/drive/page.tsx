"use client";

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { DriveGridSkeleton } from './_components/drive-skeleton';
import { TouchAuditPanel } from '@/components/ui/touch-audit';

// Lazy load the heavy DriveManager component with optimized loading
const DriveManager = dynamic(() => import('./_components/drive-manager').then(mod => ({ default: mod.DriveManager })), {
  loading: () => <DriveGridSkeleton />,
  ssr: false
});

export default function DrivePage() {
  return (
    <div className="w-full min-h-screen">
      <Suspense fallback={<DriveGridSkeleton />}>
        <DriveManager />
      </Suspense>
      <TouchAuditPanel />
    </div>
  );
}