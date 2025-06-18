import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { GoogleDriveService } from '@/lib/google-drive/service';
import { driveCache } from '@/lib/cache';
import { performanceMonitor } from '@/lib/performance-monitor';

export async function GET(request: NextRequest) {
  const callId = performanceMonitor.startAPICall('/api/drive/files');
  
  try {
    console.log('=== Drive Files API Called ===');
    const supabase = await createClient();
    
    // Get fresh session instead of just user
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session?.user) {
      console.log('Session error:', sessionError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user;
    console.log('User found:', user.email);
    console.log('User metadata:', user.user_metadata);
    console.log('Session keys:', Object.keys(session));

    // Try multiple possible token locations
    const accessToken = session.provider_token || 
                       user.user_metadata?.provider_token ||
                       session.access_token;
    
    console.log('Access token exists:', !!accessToken);
    
    if (!accessToken) {
      console.log('No access token found anywhere');
      return NextResponse.json({ 
        error: 'Google Drive access not found. Please reconnect your Google account.',
        needsReauth: true 
      }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const parentId = searchParams.get('parentId');
    const query = searchParams.get('query');
    const mimeType = searchParams.get('mimeType');
    const pageToken = searchParams.get('pageToken');
    const pageSize = parseInt(searchParams.get('pageSize') || '20'); // Reduced default page size

    // Generate cache key
    const cacheKey = driveCache.generateDriveKey({
      parentId: parentId || undefined,
      query: query || undefined,
      mimeType: mimeType || undefined,
      pageToken: pageToken || undefined,
      userId: user.id,
    });

    // Enhanced cache check with performance logging
    const cachedResult = driveCache.get(cacheKey);
    if (cachedResult && !pageToken) { // Don't cache paginated results
      console.log('Drive API: Returning cached result, items:', cachedResult.files?.length || 0);
      return NextResponse.json(cachedResult);
    }

    const driveService = new GoogleDriveService(accessToken);
    
    console.log('Drive API: Fetching files with options:', {
      parentId: parentId || undefined,
      query: query || undefined,
      mimeType: mimeType || undefined,
      pageToken: pageToken || undefined,
      pageSize,
    });
    
    const result = await driveService.listFiles({
      parentId: parentId || undefined,
      query: query || undefined,
      mimeType: mimeType || undefined,
      pageToken: pageToken || undefined,
      pageSize,
    });

    // Cache the result with smart TTL based on content type
    if (!pageToken) {
      const cacheTTL = query ? 5 : 15; // Search results: 5min, Folder contents: 15min
      driveCache.set(cacheKey, result, cacheTTL);
    }

    console.log('Drive API: Files fetched successfully, count:', result.files.length);
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Drive files API error:', error);
    
    // Handle specific Google API errors
    if (error.code === 403) {
      return NextResponse.json(
        { error: 'Google Drive access denied. Please reconnect your account.' },
        { status: 403 }
      );
    }
    
    if (error.code === 401) {
      return NextResponse.json(
        { error: 'Google Drive access expired. Please reconnect your account.' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to fetch files' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('=== Drive Upload API Called ===');
    const supabase = await createClient();
    const { data: { session }, error: authError } = await supabase.auth.getSession();

    if (authError || !session?.user) {
      console.log('Authentication failed:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('User authenticated for upload:', session.user.email);

    // Try multiple token locations
    const accessToken = session.provider_token || 
                       session.user.user_metadata?.provider_token ||
                       session.access_token;
    
    if (!accessToken) {
      console.log('No access token found for upload');
      return NextResponse.json({ 
        error: 'Google Drive access not found. Please reconnect your Google account.',
        needsReauth: true 
      }, { status: 400 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const name = formData.get('name') as string;
    const parentId = formData.get('parentId') as string;
    const description = formData.get('description') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const driveService = new GoogleDriveService(accessToken);
    const result = await driveService.uploadFile({
      file,
      metadata: {
        name: name || file.name,
        description,
      },
      parentId: parentId || undefined,
    });

    console.log('File uploaded successfully:', result.name);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Drive upload API error:', error);
    
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
          error: 'Insufficient permissions to upload files. Please check your Google Drive permissions.',
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
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}