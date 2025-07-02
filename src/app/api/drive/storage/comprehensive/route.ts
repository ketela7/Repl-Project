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

    // Get strategy from query parameters - default to fast for better performance
    const { searchParams } = new URL(request.url)
    const strategy = (searchParams.get('strategy') as 'fast' | 'complete' | 'progressive') || 'fast'

    // Create Drive client and analyzer
    const drive = createDriveClient(session.accessToken)
    const analyzer = new StorageAnalyzer(drive)

    // Add timeout protection (20 seconds max)
    const startTime = Date.now()
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Analysis timeout - try Fast analysis instead')), 20000)
    })

    try {
      const analytics = await Promise.race([
        analyzer.getAnalytics(strategy),
        timeoutPromise
      ])
      
      const totalTime = Date.now() - startTime

      // Add performance metrics
      analytics.processing.processingTimeMs = totalTime

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
    } catch (timeoutError: any) {
      if (timeoutError.message.includes('timeout')) {
        return NextResponse.json({ 
          error: 'Analysis timeout. Your Drive is large - try Fast analysis for quicker results.',
          strategy,
          suggestion: 'fast'
        }, { status: 408 })
      }
      throw timeoutError
    }
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
