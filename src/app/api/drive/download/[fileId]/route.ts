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

    // Check if it's a folder - folders cannot be downloaded
    if (fileDetails.mimeType === 'application/vnd.google-apps.folder') {
      return NextResponse.json({ 
        error: 'Cannot download folders. Please download individual files instead.',
        isFolder: true 
      }, { status: 400 });
    }

    // Check if it's a Google Workspace document that needs to be exported
    const isGoogleDoc = fileDetails.mimeType?.startsWith('application/vnd.google-apps.');
    if (isGoogleDoc && fileDetails.mimeType !== 'application/vnd.google-apps.folder') {
      return NextResponse.json({ 
        error: 'Google Workspace documents cannot be downloaded directly. Please use the export feature instead.',
        isGoogleDoc: true,
        mimeType: fileDetails.mimeType
      }, { status: 400 });
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

      if (error.message.includes('403') || error.message.includes('forbidden')) {
        return NextResponse.json({ 
          error: 'Access denied. This file cannot be downloaded. It might be a folder, a restricted file, or a Google Workspace document.',
          code: 'ACCESS_DENIED'
        }, { status: 403 });
      }

      if (error.message.includes('not found') || error.message.includes('404')) {
        return NextResponse.json({ 
          error: 'File not found' 
        }, { status: 404 });
      }

      if (error.message.includes('quota') || error.message.includes('limit')) {
        return NextResponse.json({ 
          error: 'Download quota exceeded. Please try again later.' 
        }, { status: 429 });
      }
    }

    return NextResponse.json({ 
      error: 'Failed to download file' 
    }, { status: 500 });
  }
}