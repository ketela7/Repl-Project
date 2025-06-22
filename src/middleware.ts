import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import { sessionCache, generateSessionCacheKey } from "./lib/session-cache"

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname
  
  try {
    // Log middleware activity in development only
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Middleware] Protecting: ${pathname}`);
    }
    
    // Skip middleware for auth callback to prevent redirect loops
    if (pathname.startsWith('/api/auth/')) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Middleware] Skipping auth route: ${pathname}`);
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
          console.log(`[Middleware] Cached auth for: ${cachedAuth.email}`);
        }
        return NextResponse.next();
      }
    }

    // Get NextAuth token with proper configuration
    const token = await getToken({ 
      req, 
      secret: process.env.NEXTAUTH_SECRET,
      cookieName: process.env.NODE_ENV === 'production' 
        ? '__Secure-next-auth.session-token' 
        : 'next-auth.session-token'
    })
    
    if (!token) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Middleware] No valid session - redirecting to login`);
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
      console.log(`[Middleware] Access granted to: ${token.email}`);
    }
    return NextResponse.next()
  } catch (error) {
    console.error(`[Middleware] Error:`, error);
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
