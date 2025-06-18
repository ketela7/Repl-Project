import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { GoogleDriveService } from '@/lib/google-drive/service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const supabase = await createClient();
    
    // Get session to access Google Drive
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
    
    // Get file metadata to validate and get filename
    const fileMetadata = await driveService.getFileDetails(fileId);
    
    if (!fileMetadata) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Check if it's a Google Workspace file
    if (fileMetadata.mimeType.startsWith('application/vnd.google-apps.')) {
      return NextResponse.json({ 
        error: 'Google Workspace files cannot be downloaded directly. Please use the export feature instead.' 
      }, { status: 400 });
    }

    // Generate direct download URL for large files
    const downloadUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
    
    // Return the download URL with proper headers for large file download
    return NextResponse.json({
      downloadUrl,
      filename: fileMetadata.name,
      mimeType: fileMetadata.mimeType,
      size: fileMetadata.size,
      authHeader: `Bearer ${accessToken}`
    });

  } catch (error) {
    console.error('Download URL generation error:', error);
    return NextResponse.json({ 
      error: 'Failed to generate download URL',
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}