import { NextRequest } from 'next/server'
import { withAuth } from 'next-auth/middleware'
import { securityMiddleware, isProtectedRoute } from '@/middleware/security'

export default withAuth(
  function middleware(request: NextRequest) {
    // Apply security headers using the existing security middleware
    return securityMiddleware()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow access to auth pages without token
        if (req.nextUrl.pathname.startsWith('/auth/')) {
          return true
        }
        
        // Check if route requires protection
        if (isProtectedRoute(req.nextUrl.pathname)) {
          return !!token
        }
        
        // Allow access to public routes
        return true
      },
    },
  }
)

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|public|auth/).*)'],
}