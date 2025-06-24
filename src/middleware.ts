import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import { sessionCache } from "./lib/session-cache"

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname
  
  try {
    // Log middleware activity in development only
    if (process.env.NODE_ENV === 'development') {
    }
    
    // Skip middleware for auth callback to prevent redirect loops
    if (pathname.startsWith('/api/auth/')) {
      if (process.env.NODE_ENV === 'development') {
      }
      return NextResponse.next()
    }
    
    // Check session cache first for faster middleware
    const sessionCookie = req.cookies.get(
      process.env.NODE_ENV === 'production' 
        ? '__Secure-next-auth.session-token' 
        : 'next-auth.session-token'
    );
    
    if (sessionCookie) {
      // Try to extract email from cached session for quick auth
      const cachedAuth = sessionCache.get(`middleware:${sessionCookie.value}`);
      if (cachedAuth && cachedAuth.email) {
        if (process.env.NODE_ENV === 'development') {
        }
        return NextResponse.next();
      }
    }

    // Get NextAuth token with proper configuration
    const token = await getToken({ 
      req, 
      secret: process.env.NEXTAUTH_SECRET || '',
      cookieName: process.env.NODE_ENV === 'production' 
        ? '__Secure-next-auth.session-token' 
        : 'next-auth.session-token'
    })
    
    if (!token) {
      if (process.env.NODE_ENV === 'development') {
      }
      const url = new URL('/auth/v1/login', req.url)
      url.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(url)
    }
    
    // Cache the middleware auth check for 2 minutes
    if (sessionCookie && token.email) {
      sessionCache.set(`middleware:${sessionCookie.value}`, { email: token.email }, 2 * 60 * 1000);
    }
    
    if (process.env.NODE_ENV === 'development') {
    }
    return NextResponse.next()
  } catch (error) {
    // On error, redirect to login
    const url = new URL('/auth/v1/login', req.url)
    return NextResponse.redirect(url)
  }
}

export const config = {
  matcher: [
    // Only protect dashboard routes
    '/dashboard/:path*'
  ],
};
