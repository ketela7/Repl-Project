import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { GoogleDriveService } from '@/lib/google-drive/service';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get fresh session to ensure we have the latest tokens
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session?.user) {
      console.log('Session error:', sessionError);
      return NextResponse.json({ hasAccess: false, error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user;
    console.log('User metadata keys:', Object.keys(user.user_metadata || {}));
    console.log('Provider token exists:', !!user.user_metadata?.provider_token);
    console.log('Provider refresh token exists:', !!user.user_metadata?.provider_refresh_token);

    // Try multiple possible token locations
    const accessToken = user.user_metadata?.provider_token || 
                       session.provider_token ||
                       session.access_token;
    
    if (!accessToken) {
      console.log('No access token found in:', {
        user_metadata: user.user_metadata,
        session_keys: Object.keys(session)
      });
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