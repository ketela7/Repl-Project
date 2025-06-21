import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"

export async function middleware(req: NextRequest) {
  try {
    console.log(`[Middleware] ${req.method} ${req.nextUrl.pathname}`);
    
    // Skip middleware for auth API routes
    if (req.nextUrl.pathname.startsWith('/api/auth')) {
      return NextResponse.next()
    }
    
    const token = await getToken({ 
      req, 
      secret: process.env.NEXTAUTH_SECRET,
      cookieName: "next-auth.session-token"
    })
    console.log(`[Middleware] Token exists:`, !!token);
    if (token) {
      console.log(`[Middleware] Token email:`, token.email);
    }
    
    // Protect dashboard routes
    if (req.nextUrl.pathname.startsWith('/dashboard')) {
      if (!token) {
        console.log(`[Middleware] No token, redirecting to login`);
        const url = req.nextUrl.clone()
        url.pathname = '/auth/v1/login'
        return NextResponse.redirect(url)
      }
      console.log(`[Middleware] Token found, allowing access to dashboard`);
    }
    
    return NextResponse.next()
  } catch (error) {
    console.error(`[Middleware] Critical error:`, {
      url: req.url,
      method: req.method,
      error: error instanceof Error ? error.message : String(error)
    });
    
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
