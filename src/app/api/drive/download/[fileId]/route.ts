import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { GoogleDriveService } from '@/lib/google-drive/service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { session }, error: authError } = await supabase.auth.getSession();

    if (authError || !session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Try multiple token locations
    const accessToken = session.provider_token || 
                       session.user.user_metadata?.provider_token ||
                       session.access_token;
    
    if (!accessToken) {
      return NextResponse.json({ 
        error: 'Google Drive access not found. Please reconnect your Google account.',
        needsReauth: true 
      }, { status: 400 });
    }

    const { fileId } = await params;
    const driveService = new GoogleDriveService(accessToken);
    
    // Get file metadata first
    const fileDetails = await driveService.getFileDetails(fileId);
    
    if (!fileDetails) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Get the file stream
    const fileStream = await driveService.downloadFileStream(fileId);
    
    if (!fileStream) {
      return NextResponse.json({ error: 'Failed to get file stream' }, { status: 500 });
    }

    // Return the file stream with appropriate headers
    return new NextResponse(fileStream, {
      headers: {
        'Content-Type': fileDetails.mimeType || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(fileDetails.name || 'download')}"`,
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error) {
    console.error('Download API error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('Invalid Credentials') || error.message.includes('unauthorized')) {
        return NextResponse.json({ 
          error: 'Google Drive access expired. Please reconnect your account.',
          needsReauth: true 
        }, { status: 401 });
      }

      if (error.message.includes('not found') || error.message.includes('404')) {
        return NextResponse.json({ 
          error: 'File not found' 
        }, { status: 404 });
      }
    }

    return NextResponse.json({ 
      error: 'Failed to download file' 
    }, { status: 500 });
  }
}