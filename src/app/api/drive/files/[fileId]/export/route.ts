
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { GoogleDriveService } from '@/lib/google-drive/service';

// MIME type mappings for Google Workspace exports
const EXPORT_MIME_TYPES = {
  // PDF exports (universal)
  pdf: {
    'application/vnd.google-apps.document': 'application/pdf',
    'application/vnd.google-apps.spreadsheet': 'application/pdf',
    'application/vnd.google-apps.presentation': 'application/pdf',
  },
  // Microsoft Office formats
  docx: {
    'application/vnd.google-apps.document': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  },
  xlsx: {
    'application/vnd.google-apps.spreadsheet': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  },
  pptx: {
    'application/vnd.google-apps.presentation': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  },
  // OpenDocument formats
  odt: {
    'application/vnd.google-apps.document': 'application/vnd.oasis.opendocument.text',
  },
  ods: {
    'application/vnd.google-apps.spreadsheet': 'application/vnd.oasis.opendocument.spreadsheet',
  },
  // Image formats for Google Drawings
  png: {
    'application/vnd.google-apps.drawing': 'image/png',
  },
  jpeg: {
    'application/vnd.google-apps.drawing': 'image/jpeg',
  },
};

// File extensions for downloads
const FILE_EXTENSIONS = {
  pdf: 'pdf',
  docx: 'docx',
  xlsx: 'xlsx',
  pptx: 'pptx',
  odt: 'odt',
  ods: 'ods',
  png: 'png',
  jpeg: 'jpg',
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
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

    const { fileId } = await params;
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'pdf';

    const driveService = new GoogleDriveService(accessToken);
    
    // Get file metadata first to check if it's exportable
    const fileDetails = await driveService.getFile(fileId);
    
    if (!fileDetails) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Check if file is a Google Workspace file
    if (!fileDetails.mimeType.startsWith('application/vnd.google-apps.')) {
      return NextResponse.json({ 
        error: 'Only Google Workspace files can be exported' 
      }, { status: 400 });
    }

    // Check if the requested format is supported for this file type
    const exportMimeTypes = EXPORT_MIME_TYPES[format as keyof typeof EXPORT_MIME_TYPES];
    if (!exportMimeTypes || !exportMimeTypes[fileDetails.mimeType as keyof typeof exportMimeTypes]) {
      return NextResponse.json({ 
        error: `Format ${format} is not supported for this file type` 
      }, { status: 400 });
    }

    const exportMimeType = exportMimeTypes[fileDetails.mimeType as keyof typeof exportMimeTypes];

    // Export the file using Google Drive API
    const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=${encodeURIComponent(exportMimeType)}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      if (response.status === 403) {
        return NextResponse.json({ 
          error: 'Insufficient permissions to export this file' 
        }, { status: 403 });
      }
      if (response.status === 404) {
        return NextResponse.json({ 
          error: 'File not found or cannot be exported' 
        }, { status: 404 });
      }
      throw new Error(`Export failed: ${response.status}`);
    }

    const fileBuffer = await response.arrayBuffer();
    
    // Generate filename with appropriate extension
    const extension = FILE_EXTENSIONS[format as keyof typeof FILE_EXTENSIONS];
    const fileName = `${fileDetails.name.replace(/\.[^/.]+$/, '')}.${extension}`;

    // Return the exported file
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': exportMimeType,
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': fileBuffer.byteLength.toString(),
      },
    });

  } catch (error) {
    console.error('Export API error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('Invalid Credentials') || error.message.includes('unauthorized')) {
        return NextResponse.json({ 
          error: 'Google Drive access expired. Please reconnect your account.',
          needsReauth: true 
        }, { status: 401 });
      }

      if (error.message.includes('not found') || error.message.includes('404')) {
        return NextResponse.json({ 
          error: 'File not found or cannot be exported' 
        }, { status: 404 });
      }

      if (error.message.includes('quota') || error.message.includes('limit')) {
        return NextResponse.json({ 
          error: 'Google Drive quota exceeded. Please free up space and try again.' 
        }, { status: 429 });
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to export file' },
      { status: 500 }
    );
  }
}
