import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { google } from 'googleapis';

export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.accessToken) {
      return NextResponse.json({ 
        hasAccess: false, 
        error: 'No authentication session' 
      }, { status: 401 });
    }

    // Test Google Drive API access
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({
      access_token: session.accessToken,
    });

    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    // Simple test query to check access
    await drive.files.list({
      pageSize: 1,
      fields: 'files(id, name)',
    });

    return NextResponse.json({ 
      hasAccess: true,
      user: session.user 
    });

  } catch (error: any) {
    console.error('Drive access check failed:', error);
    
    if (error.code === 401) {
      return NextResponse.json({ 
        hasAccess: false, 
        error: 'Token expired',
        needsReauth: true 
      }, { status: 401 });
    }

    return NextResponse.json({ 
      hasAccess: false, 
      error: error.message 
    }, { status: 500 });
  }
}