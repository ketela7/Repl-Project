import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { createServerRedirectUrl } from '@/lib/url-utils';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      const loginUrl = createServerRedirectUrl('/auth/v1/login', request.url);
      return NextResponse.redirect(loginUrl);
    }

    // Sign out and redirect to login with reauth parameter
    const loginUrl = createServerRedirectUrl('/auth/v1/login?reauth=drive&callbackUrl=/dashboard/drive', request.url);
    
    console.log('[Reauth Drive] Redirecting to login URL:', loginUrl);
    return NextResponse.redirect(loginUrl);
    
  } catch (error) {
    console.error('Drive re-auth error:', error);
    const loginUrl = createServerRedirectUrl('/auth/v1/login', request.url);
    return NextResponse.redirect(loginUrl);
  }
}