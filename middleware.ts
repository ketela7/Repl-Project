import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { securityMiddleware, isProtectedRoute } from '@/middleware/security'

export default auth((req) => {
  const token = req.auth
  const { pathname } = req.nextUrl

  // Apply security headers
  const securityResponse = securityMiddleware()
  
  // Allow access to auth pages without token
  if (pathname.startsWith('/auth/')) {
    return securityResponse
  }
  
  // Check if route requires protection
  if (isProtectedRoute(pathname)) {
    if (!token) {
      const url = new URL('/auth', req.url)
      return NextResponse.redirect(url)
    }
  }
  
  return securityResponse
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|public|auth/).*)'],
}