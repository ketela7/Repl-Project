import { NextRequest, NextResponse } from 'next/server';
import { auth, signIn } from '@/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.redirect(new URL('/auth/v1/login', request.url));
    }

    // Force re-authentication with Google to get Drive permissions
    // This will prompt for additional scopes
    return NextResponse.redirect(new URL('/api/auth/signin/google?prompt=consent&access_type=offline', request.url));
    
  } catch (error) {
    console.error('Drive re-auth error:', error);
    return NextResponse.redirect(new URL('/auth/v1/login', request.url));
  }
}