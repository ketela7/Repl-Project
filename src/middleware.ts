import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const { nextUrl } = req
  const isAuthenticated = !!req.auth

  // Public routes that don't require authentication
  const publicRoutes = ['/auth/signin', '/auth/error', '/api/auth']
  const isPublicRoute = publicRoutes.some(route => nextUrl.pathname.startsWith(route))

  // If user is not authenticated and trying to access protected route
  if (!isAuthenticated && !isPublicRoute && nextUrl.pathname !== '/') {
    return NextResponse.redirect(new URL('/auth/signin', nextUrl))
  }

  // If user is authenticated and trying to access auth pages, redirect to dashboard
  if (isAuthenticated && (nextUrl.pathname.startsWith('/auth') || nextUrl.pathname === '/')) {
    return NextResponse.redirect(new URL('/dashboard/drive', nextUrl))
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}