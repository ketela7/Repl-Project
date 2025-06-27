import { NextRequest, NextResponse } from 'next/server'

import { driveCache } from '@/lib/cache'

export async function POST(request: NextRequest) {
  try {
    // Clear the entire cache
    driveCache.clear()

    return NextResponse.json({
      success: true,
      message: 'Cache cleared successfully',
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to clear cache' }, { status: 500 })
  }
}
