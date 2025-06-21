import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"

export async function middleware(req: NextRequest) {
  try {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Middleware] ${req.method} ${req.nextUrl.pathname}`);
    }
    
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    
    // Protect dashboard routes
    if (req.nextUrl.pathname.startsWith('/dashboard')) {
      if (!token) {
        const url = req.nextUrl.clone()
        url.pathname = '/auth/v1/login'
        return NextResponse.redirect(url)
      }
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
  matcher: ["/dashboard/:path*", "/auth/:path*"],
};
