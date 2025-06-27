/**
 * Security middleware for setting proper security headers
 * Implements CSP, HSTS, and other security best practices
 */

import { NextResponse } from 'next/server'

export function securityMiddleware() {
  const response = NextResponse.next()

  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://accounts.google.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https://lh3.googleusercontent.com https://drive.google.com",
    "connect-src 'self' https://accounts.google.com https://www.googleapis.com",
    "frame-src 'self' https://accounts.google.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    'upgrade-insecure-requests',
  ].join('; ')

  // Security Headers
  response.headers.set('Content-Security-Policy', csp)
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')

  // HSTS for production
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
  }

  return response
}

export function isProtectedRoute(pathname: string): boolean {
  const protectedRoutes = ['/dashboard', '/api/drive', '/api/user', '/api/bulk']

  return protectedRoutes.some((route) => pathname.startsWith(route))
}
