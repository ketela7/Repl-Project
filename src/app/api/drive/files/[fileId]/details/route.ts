import { NextRequest, NextResponse } from 'next/server';
import { GoogleDriveService } from '@/lib/google-drive/service';
import { auth } from '@/auth';
import { driveCache } from '@/lib/cache';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const { fileId } = await params;

    if (!fileId) {
      return NextResponse.json({ error: 'File ID is required' }, { status: 400 });
    }

    const session = await auth();
    if (!session?.accessToken || !session?.user) {
      return NextResponse.json({ 
        error: 'Google Drive access token not found. Please reconnect your account.',
        needsReauth: true 
      }, { status: 401 });
    }

    // Check cache first (5 minute TTL for file details)
    const cacheKey = driveCache.generateFileDetailsKey(fileId, session.user.email || session.user.id || '');
    const cachedDetails = driveCache.get(cacheKey);
    if (cachedDetails) {
      console.log('File details: Returning cached result');
      return NextResponse.json(cachedDetails);
    }

    const driveService = new GoogleDriveService(session.accessToken);
    const fileDetails = await driveService.getFileDetails(fileId);

    // Cache the result for 5 minutes
    driveCache.set(cacheKey, fileDetails, 5);

    console.log('File details retrieved successfully:', fileDetails.name);
    return NextResponse.json(fileDetails);
  } catch (error) {
    console.error('Drive file details API error:', error);

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
          error: 'Insufficient permissions to view file details. Please check your Google Drive permissions.',
          needsReauth: false 
        }, { status: 403 });
      }

      if (error.message.includes('not found') || error.message.includes('404')) {
        return NextResponse.json({ 
          error: 'File not found' 
        }, { status: 404 });
      }
    }

    return NextResponse.json(
      { error: 'Failed to retrieve file details' },
      { status: 500 }
    );
  }
}