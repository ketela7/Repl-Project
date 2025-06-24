// This callback route is no longer needed with NextAuth.js
// OAuth callbacks are handled by NextAuth at /api/auth/callback/google
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  // Redirect to NextAuth callback
  const { origin } = new URL(request.url)
  return NextResponse.redirect(`${origin}/api/auth/signin`)
}
