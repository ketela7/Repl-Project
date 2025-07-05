'use client'

import { Suspense } from 'react'
import dynamic from 'next/dynamic'

import { DriveGridSkeleton } from './_components/drive-skeleton'
import { EnhancedErrorBoundary } from '@/components/error-boundary-enhanced'

// Lazy load the heavy DriveManager component with optimized loading
const DriveManager = dynamic(
  () =>
    import('./_components/drive-manager').then(mod => ({
      default: mod.DriveManager,
    })),
  {
    loading: () => <DriveGridSkeleton />,
    ssr: false,
  },
)

export default function DrivePage() {
  return (
    <div className="min-h-screen w-full">
      <EnhancedErrorBoundary showDetails={process.env.NODE_ENV === 'development'}>
        <Suspense fallback={<DriveGridSkeleton />}>
          <DriveManager />
        </Suspense>
      </EnhancedErrorBoundary>
    </div>
  )
}
