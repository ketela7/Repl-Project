import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  // This route is deprecated - NextAuth handles OAuth automatically
  return NextResponse.json({ error: 'Use NextAuth signin instead' }, { status: 400 })
}
