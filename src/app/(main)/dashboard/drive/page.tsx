'use client'

import { Suspense } from 'react'
import dynamic from 'next/dynamic'

import { SkeletonTable } from '@/components/ui/skeleton-table'
import { EnhancedErrorBoundary } from '@/components/error-boundary-enhanced'

// Lazy load the heavy DriveManager component with optimized loading
const DriveManager = dynamic(
  () =>
    import('./_components/drive-manager').then(mod => ({
      default: mod.DriveManager,
    })),
  {
    loading: () => (
      <div className="space-y-4">
        <SkeletonTable rows={8} />
      </div>
    ),
    ssr: false,
  },
)

export default function DrivePage() {
  return (
    <div className="min-h-screen w-full">
      <EnhancedErrorBoundary showDetails={process.env.NODE_ENV === 'development'}>
        <Suspense
          fallback={
            <div className="space-y-4">
              <SkeletonTable rows={8} />
            </div>
          }
        >
          <DriveManager />
        </Suspense>
      </EnhancedErrorBoundary>
    </div>
  )
}
