import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { securityMiddleware, isProtectedRoute } from '@/middleware/security'

export default auth((req) => {
  const token = req.auth
  const { pathname } = req.nextUrl

  // Apply security headers
  const securityResponse = securityMiddleware()
  
  // Add no-cache headers in development
  if (process.env.NODE_ENV === 'development') {
    securityResponse.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    securityResponse.headers.set('Pragma', 'no-cache')
    securityResponse.headers.set('Expires', '0')
  }
  
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