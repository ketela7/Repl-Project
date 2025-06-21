import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { google } from 'googleapis';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const pageSize = parseInt(searchParams.get('pageSize') || '50');
    const pageToken = searchParams.get('pageToken') || undefined;
    const view = searchParams.get('view') || null;
    const fileTypes = searchParams.get('fileTypes')?.split(',') || null;
    const parentId = searchParams.get('parentId') || undefined;

    // Set up Google Drive API
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({
      access_token: session.accessToken,
    });

    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    // Build query
    let query = 'trashed=false';
    
    if (view === 'trash') {
      query = 'trashed=true';
    }
    
    if (parentId) {
      query += ` and '${parentId}' in parents`;
    }

    if (fileTypes && fileTypes.length > 0) {
      const mimeTypeConditions = fileTypes.map(type => {
        switch (type) {
          case 'documents':
            return "mimeType contains 'document' or mimeType='application/pdf'";
          case 'images':
            return "mimeType contains 'image'";
          case 'videos':
            return "mimeType contains 'video'";
          case 'folders':
            return "mimeType='application/vnd.google-apps.folder'";
          default:
            return `mimeType contains '${type}'`;
        }
      });
      query += ` and (${mimeTypeConditions.join(' or ')})`;
    }

    console.log('Google Drive Service - Final Query:', query);

    const response = await drive.files.list({
      q: query,
      pageSize,
      pageToken,
      fields: 'nextPageToken, files(id, name, mimeType, size, createdTime, modifiedTime, webViewLink, webContentLink, thumbnailLink, parents, owners, shared, trashed, capabilities, exportLinks)',
      orderBy: 'modifiedTime desc',
    });

    console.log(`Google Drive Service - Retrieved ${response.data.files?.length || 0} files`);

    return NextResponse.json({
      files: response.data.files || [],
      nextPageToken: response.data.nextPageToken,
    });

  } catch (error: any) {
    console.error('Drive API Error:', error);
    
    if (error.code === 401) {
      return NextResponse.json({ error: 'Token expired', needsReauth: true }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Failed to fetch files', details: error.message },
      { status: 500 }
    );
  }
}