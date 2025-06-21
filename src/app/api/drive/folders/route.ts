import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { GoogleDriveService } from '@/lib/google-drive/service';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accessToken = session.accessToken;
    
    if (!accessToken) {
      return NextResponse.json({ 
        error: 'Google Drive access not found. Please reconnect your Google account.',
        needsReauth: true 
      }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const parentId = searchParams.get('parentId');

    const driveService = new GoogleDriveService(accessToken);
    const folders = await driveService.getFolders(parentId || undefined);

    return NextResponse.json(folders);
  } catch (error) {
    console.error('Drive folders API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch folders' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('=== Create Folder API Called ===');
    const supabase = await createClient();
    const { data: { session }, error: authError } = await supabase.auth.getSession();

    if (authError || !session?.user) {
      console.log('Authentication failed:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('User authenticated:', session.user.email);

    // Try multiple token locations
    const accessToken = session.provider_token || 
                       session.user.user_metadata?.provider_token ||
                       session.access_token;
    
    console.log('Access token found:', !!accessToken);
    
    if (!accessToken) {
      console.log('No access token found for Google Drive');
      return NextResponse.json({ 
        error: 'Google Drive access not found. Please reconnect your Google account.',
        needsReauth: true 
      }, { status: 400 });
    }

    const { name, parentId } = await request.json();
    console.log('Creating folder with name:', name, 'parentId:', parentId);

    if (!name) {
      return NextResponse.json({ error: 'Folder name is required' }, { status: 400 });
    }

    const driveService = new GoogleDriveService(accessToken);
    const folder = await driveService.createFolder(name, parentId);

    console.log('Folder created successfully:', folder.name);
    return NextResponse.json(folder);
  } catch (error) {
    console.error('Drive create folder API error:', error);
    
    if (error instanceof Error) {
      // Handle Google API specific errors
      if (error.message.includes('Invalid Credentials') || error.message.includes('unauthorized')) {
        return NextResponse.json({ 
          error: 'Google Drive access expired. Please reconnect your account.',
          needsReauth: true 
        }, { status: 401 });
      }

      if (error.message.includes('insufficient') || error.message.includes('403')) {
        return NextResponse.json({ 
          error: 'Insufficient permissions to create folders. Please check your Google Drive permissions.',
          needsReauth: true 
        }, { status: 403 });
      }

      if (error.message.includes('quota') || error.message.includes('limit')) {
        return NextResponse.json({ 
          error: 'Google Drive quota exceeded. Please free up space and try again.' 
        }, { status: 429 });
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to create folder' },
      { status: 500 }
    );
  }
}