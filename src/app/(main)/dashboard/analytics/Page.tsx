'use client'

import { Suspense } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
// Basic analytics component will be implemented later
import { EnhancedStorageAnalytics } from './_components/storage-analytics-new'

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
          <div className="rounded-lg border p-8 text-center text-muted-foreground">
            <p>Basic analytics component will be implemented in the next phase.</p>
            <p className="text-sm mt-2">Use Enhanced Analysis for comprehensive storage insights.</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
