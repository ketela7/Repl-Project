import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname
  
  // Skip middleware for static files, API routes, and auth pages
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/icon') ||
    pathname.startsWith('/auth') ||
    pathname === '/'
  ) {
    return NextResponse.next()
  }
  
  try {
    console.log(`[Middleware] ${req.method} ${pathname}`);
    
    // Check for session token in cookies
    const sessionCookie = req.cookies.get('next-auth.session-token')?.value ||
                         req.cookies.get('__Secure-next-auth.session-token')?.value
    
    if (!sessionCookie) {
      console.log(`[Middleware] No session cookie found, redirecting to login`);
      if (pathname.startsWith('/dashboard')) {
        const url = new URL('/auth/v1/login', req.url)
        url.searchParams.set('callbackUrl', pathname)
        return NextResponse.redirect(url)
      }
      return NextResponse.next()
    }
    
    // Verify the token
    const token = await getToken({ 
      req, 
      secret: process.env.NEXTAUTH_SECRET
    })
    
    console.log(`[Middleware] Session cookie exists:`, !!sessionCookie);
    console.log(`[Middleware] Token verified:`, !!token);
    
    // Protect dashboard routes
    if (pathname.startsWith('/dashboard')) {
      if (!token) {
        console.log(`[Middleware] Invalid token, redirecting to login`);
        const url = new URL('/auth/v1/login', req.url)
        url.searchParams.set('callbackUrl', pathname)
        return NextResponse.redirect(url)
      }
      console.log(`[Middleware] Access granted to dashboard`);
    }
    
    return NextResponse.next()
  } catch (error) {
    console.error(`[Middleware] Error:`, error);
    // On error, redirect to login for dashboard routes
    if (pathname.startsWith('/dashboard')) {
      const url = new URL('/auth/v1/login', req.url)
      return NextResponse.redirect(url)
    }
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
