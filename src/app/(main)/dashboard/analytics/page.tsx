'use client'

import { Suspense } from 'react'
import { ProgressiveStorageAnalytics } from './_components/progressive-storage-analytics'

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Storage Analytics</h1>
        <p className="text-muted-foreground">
          Real-time analysis of your Google Drive storage usage and file distribution
        </p>
      </div>

      <Suspense fallback={<div>Loading analytics...</div>}>
        <ProgressiveStorageAnalytics />
      </Suspense>
    </div>
  )
}
