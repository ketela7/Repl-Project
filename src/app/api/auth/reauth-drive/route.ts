import { NextRequest, NextResponse } from 'next/server'

import { auth } from '@/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.redirect(new URL('/auth/v1/login', request.url))
    }

    // Simple approach: Sign out current session and redirect to login
    // This will force a new OAuth flow with consent prompt

    // Sign out and redirect to login with a special parameter
    const loginUrl = new URL('/auth/v1/login', request.url)
    loginUrl.searchParams.set('reauth', 'drive')
    loginUrl.searchParams.set('callbackUrl', '/dashboard/drive')

    // We'll handle the signOut in the client side, just redirect to login for now
    return NextResponse.redirect(loginUrl.toString())
  } catch (error) {
    return NextResponse.redirect(new URL('/auth/v1/login', request.url))
  }
}
