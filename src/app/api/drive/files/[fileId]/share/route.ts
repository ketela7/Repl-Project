import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { GoogleDriveService } from '@/lib/google-drive/service';

export async function POST(
  request: NextRequest,
  { params }: { params: { fileId: string } }
) {
  try {
    const supabase = await createClient();
    
    // Get fresh session instead of just user
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session?.user) {
      console.log('Session error:', sessionError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user;
    console.log('Share API - User found:', user.email);
    console.log('Share API - User metadata:', user.user_metadata);
    console.log('Share API - Session keys:', Object.keys(session));

    // Try multiple possible token locations
    const accessToken = session.provider_token || 
                       user.user_metadata?.provider_token ||
                       session.access_token;
    
    console.log('Share API - Access token exists:', !!accessToken);
    
    if (!accessToken) {
      console.log('Share API - No access token found anywhere');
      return NextResponse.json({ 
        error: 'Google Drive access not found. Please reconnect your Google account.',
        needsReauth: true 
      }, { status: 400 });
    }

    const { fileId } = params;
    const body = await request.json();
    const { action, role = 'reader', type = 'anyone' } = body;

    if (!fileId) {
      return NextResponse.json({ error: 'File ID is required' }, { status: 400 });
    }

    console.log('=== Share File API Called ===');
    console.log('File ID:', fileId);
    console.log('Action:', action);
    console.log('Role:', role);
    console.log('Type:', type);
    console.log('Access token exists:', !!accessToken);

    const driveService = new GoogleDriveService(accessToken);

    switch (action) {
      case 'get_share_link':
        // First, make sure the file is shared with anyone with the link
        try {
          console.log('Setting file permissions for sharing...');
          await driveService.shareFile(fileId, {
            role: role as 'reader' | 'writer' | 'commenter',
            type: type as 'user' | 'group' | 'domain' | 'anyone'
          });
          console.log('File permissions updated successfully');
        } catch (permissionError) {
          console.error('Failed to update permissions:', permissionError);
          // Continue anyway - the file might already be shared
        }

        // Get the file metadata to retrieve the webViewLink
        console.log('Fetching file metadata for share link...');
        const fileMetadata = await driveService.getFile(fileId);
        
        if (!fileMetadata) {
          return NextResponse.json(
            { error: 'File not found' },
            { status: 404 }
          );
        }

        const shareLink = fileMetadata.webViewLink;
        if (!shareLink) {
          return NextResponse.json(
            { error: 'Unable to generate share link for this file' },
            { status: 400 }
          );
        }

        console.log('Share link generated successfully:', shareLink);
        return NextResponse.json({
          success: true,
          webViewLink: shareLink,
          fileId: fileId,
          fileName: fileMetadata.name
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Share API error:', error);
    
    // Handle specific Google API errors
    if (error instanceof Error) {
      if (error.message.includes('invalid_grant') || error.message.includes('invalid_token')) {
        return NextResponse.json(
          { error: 'Google Drive access expired', needsReauth: true },
          { status: 401 }
        );
      }
      
      if (error.message.includes('insufficientFilePermissions') || error.message.includes('forbidden')) {
        return NextResponse.json(
          { error: 'Insufficient permissions to share this file' },
          { status: 403 }
        );
      }
      
      if (error.message.includes('notFound')) {
        return NextResponse.json(
          { error: 'File not found' },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}