import { NextRequest } from "next/server";
import { updateSession } from "./lib/supabase/middleware";

export async function middleware(req: NextRequest) {
  try {
    console.log(`[Middleware] Processing request: ${req.method} ${req.url}`);
    const response = await updateSession(req);
    console.log(`[Middleware] Request processed successfully`);
    return response;
  } catch (error) {
    console.error(`[Middleware] Error processing request:`, error);
    throw error;
  }
}

export const config = {
  matcher: ["/dashboard/:path*", "/auth/:path*"],
};
