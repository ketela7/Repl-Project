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

    // Check if it's an audio file
    if (!fileDetails.mimeType.startsWith('audio/')) {
      return NextResponse.json({ error: 'File is not an audio file' }, { status: 400 });
    }

    // Get the file stream
    const fileStream = await driveService.downloadFileStream(fileId);
    
    if (!fileStream) {
      return NextResponse.json({ error: 'Failed to get file stream' }, { status: 500 });
    }

    // Return the audio stream with appropriate headers
    return new NextResponse(fileStream, {
      headers: {
        'Content-Type': fileDetails.mimeType,
        'Content-Disposition': `inline; filename="${fileDetails.name}"`,
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Audio proxy API error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('Invalid Credentials') || error.message.includes('unauthorized')) {
        return NextResponse.json({ 
          error: 'Google Drive access expired. Please reconnect your account.',
          needsReauth: true 
        }, { status: 401 });
      }

      if (error.message.includes('not found') || error.message.includes('404')) {
        return NextResponse.json({ 
          error: 'Audio file not found' 
        }, { status: 404 });
      }
    }

    return NextResponse.json({ 
      error: 'Failed to proxy audio file' 
    }, { status: 500 });
  }
}