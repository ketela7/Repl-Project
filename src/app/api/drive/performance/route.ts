import { NextResponse } from 'next/server'

import { performanceMonitor } from '@/lib/googledrive/performance'
import { initDriveService } from '@/lib/apiutils'

export async function GET() {
  try {
    const authResult = await initDriveService()
    if (!authResult.success) {
      return authResult.response!
    }

    const stats = performanceMonitor.getStats()

    return NextResponse.json({
      success: true,
      data: {
        performance: stats,
        timestamp: new Date().toISOString(),
        summary: {
          totalOperations: Object.values(stats).reduce((sum, stat) => sum + stat.count, 0),
          avgResponseTime:
            Object.values(stats).reduce((sum, stat) => sum + stat.avgTime, 0) / Object.keys(stats).length || 0,
          overallErrorRate:
            Object.values(stats).reduce((sum, stat) => sum + stat.errorRate, 0) / Object.keys(stats).length || 0,
        },
      },
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch performance metrics' }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const authResult = await initDriveService()
    if (!authResult.success) {
      return authResult.response!
    }

    performanceMonitor.reset()

    return NextResponse.json({
      success: true,
      message: 'Performance metrics reset successfully',
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to reset performance metrics' }, { status: 500 })
  }
}
