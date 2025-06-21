import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { google } from 'googleapis';

export async function GET(
  request: NextRequest,
  { params }: { params: { fileId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { fileId } = params;
    
    // Setup Google Drive API
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: session.accessToken });
    const drive = google.drive({ version: 'v3', auth });

    // Get file metadata first
    const fileMetadata = await drive.files.get({
      fileId,
      fields: 'name,mimeType,size'
    });

    const fileName = fileMetadata.data.name || 'download';
    const mimeType = fileMetadata.data.mimeType || 'application/octet-stream';

    // Download file content
    const response = await drive.files.get({
      fileId,
      alt: 'media'
    }, {
      responseType: 'stream'
    });

    // Create readable stream from response
    const stream = response.data as NodeJS.ReadableStream;
    
    // Convert stream to buffer
    const chunks: Buffer[] = [];
    
    return new Promise<NextResponse>((resolve, reject) => {
      stream.on('data', (chunk) => {
        chunks.push(Buffer.from(chunk));
      });
      
      stream.on('end', () => {
        const buffer = Buffer.concat(chunks);
        
        const headers = new Headers();
        headers.set('Content-Type', mimeType);
        headers.set('Content-Disposition', `attachment; filename="${fileName}"`);
        headers.set('Content-Length', buffer.length.toString());
        
        resolve(new NextResponse(buffer, { headers }));
      });
      
      stream.on('error', (error) => {
        console.error('Download stream error:', error);
        reject(NextResponse.json({ error: 'Download failed' }, { status: 500 }));
      });
    });

  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json(
      { error: 'Failed to download file' },
      { status: 500 }
    );
  }
}