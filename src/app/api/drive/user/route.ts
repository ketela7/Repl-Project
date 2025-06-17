import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { GoogleDriveService } from '@/lib/google-drive/service';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accessToken = user.user_metadata?.provider_token;
    if (!accessToken) {
      return NextResponse.json({ error: 'Google Drive access not found' }, { status: 400 });
    }

    const driveService = new GoogleDriveService(accessToken);
    const userInfo = await driveService.getUserInfo();

    return NextResponse.json(userInfo);
  } catch (error) {
    console.error('Drive user API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user info' },
      { status: 500 }
    );
  }
}