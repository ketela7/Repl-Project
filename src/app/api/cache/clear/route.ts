import { NextResponse } from 'next/server'

import { driveCache } from '@/lib/cache'

export async function POST() {
  try {
    driveCache.clear()
    return NextResponse.json({
      success: true,
      message: 'Cache cleared successfully',
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to clear cache' },
      { status: 500 }
    )
  }
}
