import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { google } from 'googleapis';

export async function POST(
  request: NextRequest,
  { params }: { params: { fileId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { fileId } = params;
    const { parentId } = await request.json();
    
    // Setup Google Drive API
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: session.accessToken });
    const drive = google.drive({ version: 'v3', auth });

    // Get current parents
    const file = await drive.files.get({
      fileId,
      fields: 'parents'
    });

    const previousParents = file.data.parents?.join(',') || '';

    // Move the file
    const response = await drive.files.update({
      fileId,
      addParents: parentId,
      removeParents: previousParents,
      fields: 'id,parents'
    });

    return NextResponse.json({ 
      success: true, 
      file: response.data 
    });

  } catch (error) {
    console.error('Move error:', error);
    return NextResponse.json(
      { error: 'Failed to move file' },
      { status: 500 }
    );
  }
}