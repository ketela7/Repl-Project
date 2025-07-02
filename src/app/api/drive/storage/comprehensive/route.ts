import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createDriveClient } from '@/lib/google-drive/config'
import { StorageAnalyzer } from '@/lib/google-drive/storage'

/**
 * Enhanced Storage Analytics API with complete pagination support
 * GET /api/drive/storage/comprehensive?strategy=progressive
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Get strategy from query parameters
    const { searchParams } = new URL(request.url)
    const strategy =
      (searchParams.get('strategy') as 'fast' | 'complete' | 'progressive') || 'progressive'

    // Create Drive client and analyzer
    const drive = createDriveClient(session.accessToken)
    const analyzer = new StorageAnalyzer(drive)

    // Get analytics
    const startTime = Date.now()
    const analytics = await analyzer.getAnalytics(strategy)
    const totalTime = Date.now() - startTime

    // Add performance metrics
    analytics.processing.totalProcessingTimeMs = totalTime

    return NextResponse.json({
      success: true,
      data: analytics,
      meta: {
        strategy,
        performanceMs: totalTime,
        accuracy: analytics.processing.estimatedAccuracy,
        apiCallsUsed: analytics.processing.totalApiCalls,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error: any) {
    console.error('Comprehensive storage analytics error:', error)

    // Handle specific Google API errors
    if (error.code === 401 || error.status === 401) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    if (error.code === 403 || error.status === 403) {
      return NextResponse.json(
        {
          error: 'Insufficient permissions',
          details: 'This application needs full Google Drive access to analyze storage',
        },
        { status: 403 },
      )
    }

    if (error.code === 429 || error.status === 429) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          details: 'Too many requests. Please try again in a few minutes.',
        },
        { status: 429 },
      )
    }

    return NextResponse.json(
      {
        error: 'Failed to analyze storage',
        details: error.message || 'Unknown error occurred',
      },
      { status: 500 },
    )
  }
}
