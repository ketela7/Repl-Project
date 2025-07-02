import { NextResponse } from 'next/server'

export async function GET() {
  try {
    return NextResponse.json({ status: 'ok', timestamp: new Date().toISOString() }, { status: 200 })
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
