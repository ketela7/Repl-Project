import { NextRequest, NextResponse } from "next/server"

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname
  
  // Skip middleware for API routes, static files, and auth pages
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
  
  // For dashboard routes, check for session cookie presence
  if (pathname.startsWith('/dashboard')) {
    console.log(`[Middleware] Checking dashboard access for: ${pathname}`);
    
    // Check if NextAuth session cookie exists
    const sessionToken = req.cookies.get('next-auth.session-token')?.value ||
                        req.cookies.get('__Secure-next-auth.session-token')?.value
    
    console.log(`[Middleware] Session cookie exists:`, !!sessionToken);
    console.log(`[Middleware] All cookies:`, req.cookies.getAll().map(c => c.name));
    
    if (!sessionToken) {
      console.log(`[Middleware] No session cookie - redirecting to login`);
      const url = new URL('/auth/v1/login', req.url)
      url.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(url)
    }
    
    console.log(`[Middleware] Session cookie found - allowing access`);
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    // Disable middleware temporarily to test NextAuth
    // '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
