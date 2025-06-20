import { NextRequest } from "next/server";
import { updateSession } from "./lib/supabase/middleware";

export async function middleware(req: NextRequest) {
  try {
    // Reduced logging to prevent spam
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Middleware] ${req.method} ${req.nextUrl.pathname}`);
    }
    
    const response = await updateSession(req);
    return response;
  } catch (error) {
    console.error(`[Middleware] Critical error:`, {
      url: req.url,
      method: req.method,
      error: error instanceof Error ? error.message : String(error)
    });
    
    // Instead of throwing, return a proper response to prevent crashes
    return new Response('Internal Server Error', { status: 500 });
  }
}

export const config = {
  matcher: ["/dashboard/:path*", "/auth/:path*"],
};
