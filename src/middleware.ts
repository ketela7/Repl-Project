import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname
  
  try {
    console.log(`[Middleware] Protecting: ${pathname}`);
    
    // Skip middleware for auth callback to prevent redirect loops
    if (pathname.startsWith('/api/auth/')) {
      console.log(`[Middleware] Skipping auth route: ${pathname}`);
      return NextResponse.next()
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
      console.log(`[Middleware] No valid session - redirecting to login`);
      const url = new URL('/auth/v1/login', req.url)
      url.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(url)
    }
    
    console.log(`[Middleware] Access granted to: ${token.email}`);
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
