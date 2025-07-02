import { NextResponse } from 'next/server'

export async function GET() {
  try {
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ status: 'error', error: 'Server unavailable' }, { status: 500 })
  }
}

export async function HEAD() {
  try {
    return new NextResponse(null, { status: 200 })
  } catch {
    return new NextResponse(null, { status: 500 })
  }
}
