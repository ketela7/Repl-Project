'use client'

import { Suspense } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { StorageAnalytics } from './_components/storage-analytics'
import { EnhancedStorageAnalytics } from './_components/enhanced-storage-analytics'

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Storage Analytics</h1>
        <p className="text-muted-foreground">
          Comprehensive analysis of your Google Drive storage usage and file distribution
        </p>
      </div>

      <Tabs defaultValue="enhanced" className="space-y-4">
        <TabsList>
          <TabsTrigger value="enhanced">Enhanced Analysis</TabsTrigger>
          <TabsTrigger value="basic">Basic Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="enhanced">
          <Suspense fallback={<div>Loading enhanced analytics...</div>}>
            <EnhancedStorageAnalytics />
          </Suspense>
        </TabsContent>

        <TabsContent value="basic">
          <Suspense fallback={<div>Loading basic analytics...</div>}>
            <StorageAnalytics />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  )
}
