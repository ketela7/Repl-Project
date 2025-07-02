/**
 * Security middleware for setting proper security headers
 * Implements CSP, HSTS, and other security best practices
 */

import { NextResponse } from 'next/server'

export function securityMiddleware() {
  const response = NextResponse.next()

  // Content Security Policy
  const csp = [
    "defaultsrc 'self'",
    "scriptsrc 'self' 'unsafeeval' 'unsafeinline' https://accounts.google.com",
    "stylesrc 'self' 'unsafeinline' https://fonts.googleapis.com",
    "fontsrc 'self' https://fonts.gstatic.com",
    "imgsrc 'self' data: https://lh3.googleusercontent.com https://drive.google.com",
    "connectsrc 'self' https://accounts.google.com https://www.googleapis.com",
    "framesrc 'self' https://accounts.google.com",
    "objectsrc 'none'",
    "baseuri 'self'",
    "formaction 'self'",
    "frameancestors 'none'",
    'upgradeinsecurerequests',
  ].join('; ')

  // Security Headers
  response.headers.set('Content-Security-Policy', csp)
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strictoriginwhencrossorigin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')

  // HSTS for production
  if (process.env.NODEENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'maxage=31536000; includeSubDomains; preload')
  }

  return response
}

export function isProtectedRoute(pathname: string): boolean {
  const protectedRoutes = ['/dashboard', '/api/drive', '/api/user', '/api/bulk']

  return protectedRoutes.some(route => pathname.startsWith(route))
}
