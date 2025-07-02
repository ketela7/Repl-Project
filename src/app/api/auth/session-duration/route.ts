import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { rememberMe } = await request.json()

    // Calculate cookie duration based on remember me preference
    const duration = rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60 // 30 days or 1 day

    // Create response
    const response = NextResponse.json({
      success: true,
      duration,
      message: rememberMe ? 'Session extended to 30 days' : 'Session set to 1 day',
    })

    // Set cookie with new duration
    const cookieName =
      process.env.NODE_ENV === 'production' ? '__Secure-next-auth.session-token' : 'next-auth.session-token'

    // Get current session token from request
    const currentToken = request.cookies.get(cookieName)?.value

    if (currentToken) {
      // Set new cookie with updated maxAge
      response.cookies.set(cookieName, currentToken, {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: duration,
      })
    }

    return response
  } catch (error) {
    console.error('Session duration update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
