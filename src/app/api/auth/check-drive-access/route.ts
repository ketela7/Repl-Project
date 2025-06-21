import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { GoogleDriveService } from '@/lib/google-drive/service';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      console.log('No session found');
      return NextResponse.json({ hasAccess: false, error: 'Unauthorized' }, { status: 401 });
    }

    const accessToken = session.accessToken;
    
    if (!accessToken) {
      console.log('No access token found in session');
      return NextResponse.json({ 
        hasAccess: false, 
        error: 'No access token',
        needsReauth: true 
      });
    }

    try {
      // Test Drive access by making a simple API call
      const driveService = new GoogleDriveService(accessToken);
      await driveService.getUserInfo();
      
      return NextResponse.json({ hasAccess: true });
    } catch (error: any) {
      console.error('Drive access test failed:', error);
      
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
    console.error('Check drive access error:', error);
    return NextResponse.json({ 
      hasAccess: false, 
      error: 'Server error' 
    }, { status: 500 });
  }
}