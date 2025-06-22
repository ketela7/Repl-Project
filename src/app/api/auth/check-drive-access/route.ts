import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { GoogleDriveService } from '@/lib/google-drive/service';
import { driveCache } from '@/lib/cache';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      if (process.env.NODE_ENV === 'development') {
        console.log('No session found');
      }
      return NextResponse.json({ hasAccess: false, error: 'Unauthorized' }, { status: 401 });
    }

    const accessToken = session.accessToken;
    
    if (!accessToken) {
      if (process.env.NODE_ENV === 'development') {
        console.log('No access token found in session');
      }
      return NextResponse.json({ 
        hasAccess: false, 
        error: 'No access token',
        needsReauth: true 
      });
    }

    try {
      // Check cache first for faster response
      const cacheKey = `drive-access:${session.user.email}`;
      const cachedResult = driveCache.get(cacheKey);
      
      if (cachedResult) {
        return NextResponse.json({ hasAccess: true });
      }

      // Test Drive access with a lightweight API call
      const driveService = new GoogleDriveService(accessToken);
      
      // Use a minimal files.list call instead of getUserInfo for faster response
      await driveService.listFiles({ pageSize: 1 });
      
      // Cache successful result for 5 minutes
      driveCache.set(cacheKey, { hasAccess: true }, 5);
      
      return NextResponse.json({ hasAccess: true });
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Drive access test failed:', error);
      }
      
      // Check if error is related to insufficient scope
      if (error.message?.includes('insufficient') || error.code === 403) {
        return NextResponse.json({ 
          hasAccess: false, 
          error: 'Insufficient permissions',
          needsReauth: true
        });
      }
      
      return NextResponse.json({ 
        hasAccess: false, 
        error: error.message || 'Drive access failed'
      });
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Check drive access error:', error);
    }
    return NextResponse.json({ 
      hasAccess: false, 
      error: 'Server error' 
    }, { status: 500 });
  }
}