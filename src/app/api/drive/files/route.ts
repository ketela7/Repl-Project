import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { GoogleDriveService } from '@/lib/google-drive/service';
import { driveCache } from '@/lib/cache';

// Client-side filter helper function
function applyClientSideFilters(
  result: any, 
  filters: { 
    view?: string | null, 
    fileTypes?: string | null, 
    query?: string | null,
    sizeMin?: string | null,
    sizeMax?: string | null
  }
) {
  if (!result || !result.files || !Array.isArray(result.files)) return result;

  let filteredFiles = [...result.files];

  // Apply additional client-side filters for complex scenarios
  if (filters.fileTypes) {
    const types = filters.fileTypes.split(',').filter(Boolean);

    filteredFiles = filteredFiles.filter(file => {
      return types.some(type => {
        switch (type.toLowerCase()) {
          case 'folder':
            return file.mimeType === 'application/vnd.google-apps.folder';
          case 'document':
            return file.mimeType?.includes('document') || 
                   file.mimeType?.includes('pdf') || 
                   file.mimeType?.includes('text') ||
                   file.mimeType?.includes('word');
          case 'spreadsheet':
            return file.mimeType?.includes('spreadsheet') || 
                   file.mimeType?.includes('excel') ||
                   file.mimeType?.includes('csv');
          case 'presentation':
            return file.mimeType?.includes('presentation') || 
                   file.mimeType?.includes('powerpoint');
          case 'image':
            return file.mimeType?.startsWith('image/');
          case 'video':
            return file.mimeType?.startsWith('video/');
          case 'audio':
            return file.mimeType?.startsWith('audio/');
          case 'archive':
            return file.mimeType?.includes('zip') || 
                   file.mimeType?.includes('rar') ||
                   file.mimeType?.includes('tar') ||
                   file.mimeType?.includes('gzip') ||
                   file.mimeType?.includes('7z');
          case 'code':
            return file.mimeType?.includes('javascript') ||
                   file.mimeType?.includes('html') ||
                   file.mimeType?.includes('css') ||
                   file.mimeType?.includes('json') ||
                   file.mimeType?.includes('xml') ||
                   (file.mimeType?.startsWith('text/') && 
                    !file.mimeType?.includes('plain'));
          default:
            return true;
        }
      });
    });
  }

  // Apply additional query filtering for more complex searches
  if (filters.query && filters.query.trim()) {
    const searchTerm = filters.query.toLowerCase();
    filteredFiles = filteredFiles.filter(file => 
      file.name?.toLowerCase().includes(searchTerm) ||
      file.description?.toLowerCase().includes(searchTerm)
    );
  }

  // Apply size filtering (client-side since Google Drive API doesn't support it)
  if (filters.sizeMin || filters.sizeMax) {
    filteredFiles = filteredFiles.filter(file => {
      // Skip folders and files without size information
      if (!file.size || file.mimeType === 'application/vnd.google-apps.folder') {
        return true;
      }
      
      const fileSize = parseInt(file.size);
      const sizeMin = filters.sizeMin ? parseInt(filters.sizeMin) : 0;
      const sizeMax = filters.sizeMax ? parseInt(filters.sizeMax) : Number.MAX_SAFE_INTEGER;
      
      return fileSize >= sizeMin && fileSize <= sizeMax;
    });
  }

  return {
    ...result,
    files: filteredFiles
  };
}

export async function GET(request: NextRequest) {
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

    // Enhanced token detection with debugging
    const accessToken = session.provider_token || 
                       user.user_metadata?.provider_token ||
                       user.user_metadata?.access_token ||
                       session.access_token;

    console.log('Token search results:', {
      session_provider_token: !!session.provider_token,
      user_metadata_provider_token: !!user.user_metadata?.provider_token,
      user_metadata_access_token: !!user.user_metadata?.access_token,
      session_access_token: !!session.access_token,
      final_token_found: !!accessToken
    });

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
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const view = searchParams.get('view');
    const fileTypes = searchParams.get('fileTypes');
    const createdAfter = searchParams.get('createdAfter');
    const createdBefore = searchParams.get('createdBefore');
    const modifiedAfter = searchParams.get('modifiedAfter');
    const modifiedBefore = searchParams.get('modifiedBefore');
    const owner = searchParams.get('owner');
    const sizeMin = searchParams.get('sizeMin');
    const sizeMax = searchParams.get('sizeMax');

    // Build proper Google Drive API query based on official documentation
    let driveQuery = "";
    let useCustomParameters = false;

    // Handle different views with proper Google Drive API approach
    if (view === 'shared') {
      driveQuery = "sharedWithMe=true and trashed=false";
    } else if (view === 'starred') {
      driveQuery = "starred=true and trashed=false";
    } else if (view === 'recent') {
      // For recent files, we'll use orderBy and limit results
      driveQuery = "trashed=false";
      useCustomParameters = true;
    } else if (view === 'trash') {
      driveQuery = "trashed=true";
    } else if (view === 'my-drive') {
      // My Drive view - show only root files when no parent specified
      driveQuery = "trashed=false";

      // Handle folder navigation
      if (parentId) {
        driveQuery += ` and '${parentId}' in parents`;
      } else if (!query) {
        // Show root files only when no search query and no parent
        driveQuery += " and 'root' in parents";
      }
    } else {
      // All Files view - show everything without root restriction
      driveQuery = "trashed=false";

      // Handle folder navigation only
      if (parentId) {
        driveQuery += ` and '${parentId}' in parents`;
      }
    }

    // Handle search query
    if (query) {
      driveQuery += ` and name contains '${query.replace(/'/g, "\\'")}'`;
    }

    // Handle legacy mimeType parameter
    if (mimeType) {
      driveQuery += ` and mimeType='${mimeType}'`;
    }

    // Handle file type filters
    if (fileTypes) {
      const types = fileTypes.split(',').filter(Boolean);
      const mimeTypeConditions: string[] = [];

      types.forEach(type => {
        switch (type.toLowerCase()) {
          case 'folder':
            mimeTypeConditions.push("mimeType='application/vnd.google-apps.folder'");
            break;
          case 'document':
            mimeTypeConditions.push("(mimeType='application/vnd.google-apps.document' or mimeType='application/pdf' or mimeType='text/plain' or mimeType='application/msword' or mimeType='application/vnd.openxmlformats-officedocument.wordprocessingml.document')");
            break;
          case 'spreadsheet':
            mimeTypeConditions.push("(mimeType='application/vnd.google-apps.spreadsheet' or mimeType='application/vnd.ms-excel' or mimeType='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')");
            break;
          case 'presentation':
            mimeTypeConditions.push("(mimeType='application/vnd.google-apps.presentation' or mimeType='application/vnd.ms-powerpoint' or mimeType='application/vnd.openxmlformats-officedocument.presentationml.presentation')");
            break;
          case 'image':
            mimeTypeConditions.push("(mimeType contains 'image/')");
            break;
          case 'video':
            mimeTypeConditions.push("(mimeType contains 'video/')");
            break;
          case 'audio':
            mimeTypeConditions.push("(mimeType contains 'audio/')");
            break;
          case 'archive':
            mimeTypeConditions.push("(mimeType='application/zip' or mimeType='application/x-rar-compressed' or mimeType='application/x-tar' or mimeType='application/gzip' or mimeType='application/x-7z-compressed')");
            break;
        }
      });

      if (mimeTypeConditions.length > 0) {
        driveQuery += ` and (${mimeTypeConditions.join(' or ')})`;
      }
    }

    // Handle advanced filters with proper Google Drive API syntax
    if (createdAfter) {
      driveQuery += ` and createdTime >= '${createdAfter}'`;
    }
    if (createdBefore) {
      driveQuery += ` and createdTime <= '${createdBefore}'`;
    }
    if (modifiedAfter) {
      driveQuery += ` and modifiedTime >= '${modifiedAfter}'`;
    }
    if (modifiedBefore) {
      driveQuery += ` and modifiedTime <= '${modifiedBefore}'`;
    }
    if (owner) {
      driveQuery += ` and '${owner.replace(/'/g, "\\'")}' in owners`;
    }
    
    // Note: Google Drive API does not support size filtering directly
    // Size filtering will be handled client-side after data retrieval

    console.log('Google Drive API Query:', driveQuery);

    // Generate cache key including all filter parameters
    const cacheKey = driveCache.generateDriveKey({
      parentId: parentId || undefined,
      query: driveQuery || undefined,
      mimeType: mimeType || undefined,
      pageToken: pageToken || undefined,
      userId: user.id,
    }) + `_${view || 'all'}_${fileTypes || ''}`;

    // Temporarily disable cache to test fresh API calls
    // const cachedResult = driveCache.get(cacheKey);
    // if (cachedResult && !pageToken) {
    //   console.log('Drive API: Returning cached result, items:', cachedResult.files?.length || 0);
    //   const filteredResult = applyClientSideFilters(cachedResult, { view, fileTypes, query });
    //   return NextResponse.json(filteredResult);
    // }

    const driveService = new GoogleDriveService(accessToken);

    console.log('Drive API: Fetching files with enhanced options:', {
      parentId: parentId || undefined,
      query: driveQuery,
      pageToken: pageToken || undefined,
      pageSize,
      view,
      fileTypes
    });

    // Use the constructed query instead of individual parameters with proper ordering
    const orderBy = view === 'recent' ? 'viewedByMeTime desc' : 'modifiedTime desc';

    const result = await driveService.listFiles({
      query: driveQuery,
      pageToken: pageToken || undefined,
      pageSize,
      orderBy
    });

    // Apply client-side filters to enhance API results
    const filteredResult = applyClientSideFilters(result, { 
      view, 
      fileTypes, 
      query,
      sizeMin,
      sizeMax
    });

    // Cache the filtered result with smart TTL based on content type
    if (!pageToken) {
      const cacheTTL = query ? 5 : 15; // Search results: 5min, Folder contents: 15min
      driveCache.set(cacheKey, filteredResult, cacheTTL);
    }

    console.log('Drive API: Files fetched and filtered successfully, count:', filteredResult.files.length);

    return NextResponse.json(filteredResult);
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