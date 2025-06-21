
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { GoogleDriveService } from '@/lib/google-drive/service';
import { driveCache } from '@/lib/cache';

interface FileFilter {
  fileType?: string;
  viewStatus?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  minSize?: number;
  maxSize?: number;
  createdAfter?: string;
  createdBefore?: string;
  modifiedAfter?: string;
  modifiedBefore?: string;
  owner?: string;
}

function buildDriveQuery(filters: FileFilter): string {
  const conditions: string[] = [];
  
  // Basic file filtering (non-trashed by default unless viewing trash)
  if (filters.viewStatus === 'trash') {
    conditions.push('trashed=true');
  } else {
    conditions.push('trashed=false');
  }
  
  // View status filters
  switch (filters.viewStatus) {
    case 'shared':
      conditions.push('sharedWithMe=true');
      break;
    case 'starred':
      conditions.push('starred=true');
      break;
    case 'recent':
      // Recent files are handled by sorting, not querying
      break;
    case 'my-drive':
      conditions.push('\'me\' in owners');
      break;
  }
  
  // File type filters - handle both single and multiple types
  if (filters.fileType && filters.fileType !== 'all') {
    // Handle comma-separated file types from frontend
    const fileTypes = filters.fileType.split(',').filter(type => type && type !== 'all');
    
    if (fileTypes.length > 0) {
      const typeConditions: string[] = [];
      
      fileTypes.forEach(type => {
        switch (type.trim()) {
          case 'folder':
            typeConditions.push('mimeType=\'application/vnd.google-apps.folder\'');
            break;
          case 'document':
            typeConditions.push('(mimeType contains \'document\' or mimeType=\'application/pdf\' or mimeType contains \'text\')');
            break;
          case 'spreadsheet':
            typeConditions.push('mimeType contains \'spreadsheet\'');
            break;
          case 'presentation':
            typeConditions.push('mimeType contains \'presentation\'');
            break;
          case 'image':
            typeConditions.push('mimeType contains \'image\'');
            break;
          case 'video':
            typeConditions.push('mimeType contains \'video\'');
            break;
          case 'audio':
            typeConditions.push('mimeType contains \'audio\'');
            break;
          case 'archive':
            typeConditions.push('(mimeType=\'application/zip\' or mimeType=\'application/x-rar-compressed\' or mimeType=\'application/x-tar\')');
            break;
          case 'code':
            typeConditions.push('(mimeType contains \'javascript\' or mimeType contains \'python\' or mimeType contains \'text/x-\')');
            break;
        }
      });
      
      if (typeConditions.length > 0) {
        conditions.push(`(${typeConditions.join(' or ')})`);
      }
    }
  }
  
  // Search query
  if (filters.search) {
    const searchTerm = filters.search.replace(/'/g, "\\'");
    conditions.push(`name contains '${searchTerm}'`);
  }
  
  // Date filters
  if (filters.createdAfter) {
    conditions.push(`createdTime >= '${filters.createdAfter}'`);
  }
  if (filters.createdBefore) {
    conditions.push(`createdTime <= '${filters.createdBefore}'`);
  }
  if (filters.modifiedAfter) {
    conditions.push(`modifiedTime >= '${filters.modifiedAfter}'`);
  }
  if (filters.modifiedBefore) {
    conditions.push(`modifiedTime <= '${filters.modifiedBefore}'`);
  }
  
  return conditions.join(' and ');
}

function applyClientSideFilters(files: any[], filters: FileFilter) {
  let filteredFiles = [...files];
  
  // Apply size filters (client-side only as Drive API doesn't support size filtering)
  if (filters.minSize || filters.maxSize) {
    filteredFiles = filteredFiles.filter(file => {
      if (!file.size) return true; // Keep files without size info
      const sizeInBytes = parseInt(file.size);
      if (filters.minSize && sizeInBytes < filters.minSize) return false;
      if (filters.maxSize && sizeInBytes > filters.maxSize) return false;
      return true;
    });
  }
  
  // Apply owner filter (client-side)
  if (filters.owner) {
    const ownerQuery = filters.owner.toLowerCase();
    filteredFiles = filteredFiles.filter(file => {
      const ownerName = file.owners?.[0]?.displayName?.toLowerCase() || '';
      const ownerEmail = file.owners?.[0]?.emailAddress?.toLowerCase() || '';
      return ownerName.includes(ownerQuery) || ownerEmail.includes(ownerQuery);
    });
  }
  
  return filteredFiles;
}

function getSortKey(sortBy: string) {
  switch (sortBy) {
    case 'name': return 'name';
    case 'modified': return 'modifiedTime';
    case 'created': return 'createdTime';
    case 'size': return 'quotaBytesUsed';
    default: return 'modifiedTime';
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('=== Drive Files API Called ===');
    
    const session = await auth();
    
    if (!session?.user) {
      console.log('No session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user;
    console.log('User found:', user.email);

    const accessToken = session.accessToken;
    
    if (!accessToken) {
      console.log('No access token found');
      return NextResponse.json({ 
        error: 'No access token found',
        needsReauth: true 
      }, { status: 401 });
    }

    console.log('Access token found, proceeding with Drive API call');

    const { searchParams } = new URL(request.url);
    
    // Parse query parameters with proper mapping
    const filters: FileFilter = {
      fileType: searchParams.get('fileTypes') || searchParams.get('fileType') || 'all',
      viewStatus: searchParams.get('view') || searchParams.get('viewStatus') || 'all',
      sortBy: searchParams.get('sortBy') || 'modified',
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
      search: searchParams.get('search') || searchParams.get('query') || undefined,
      minSize: searchParams.get('sizeMin') || searchParams.get('minSize') ? parseInt(searchParams.get('sizeMin') || searchParams.get('minSize')!) : undefined,
      maxSize: searchParams.get('sizeMax') || searchParams.get('maxSize') ? parseInt(searchParams.get('sizeMax') || searchParams.get('maxSize')!) : undefined,
      createdAfter: searchParams.get('createdAfter') || undefined,
      createdBefore: searchParams.get('createdBefore') || undefined,
      modifiedAfter: searchParams.get('modifiedAfter') || undefined,
      modifiedBefore: searchParams.get('modifiedBefore') || undefined,
      owner: searchParams.get('owner') || undefined,
    };

    const pageSize = parseInt(searchParams.get('pageSize') || '50');
    const pageToken = searchParams.get('pageToken') || undefined;
    const folderId = searchParams.get('folderId') || searchParams.get('parentId') || undefined;

    console.log('Filters applied:', filters);

    // Check cache first
    const cacheKey = driveCache.generateDriveKey({
      pageSize,
      pageToken,
      parentId: folderId,
      userId: user.email || 'unknown',
      filters: JSON.stringify(filters)
    });

    // Build the Drive API query using the consolidated function
    let driveQuery = buildDriveQuery(filters);
    
    // Add parent folder constraint if needed
    if (folderId && filters.viewStatus !== 'shared' && filters.viewStatus !== 'starred' && filters.viewStatus !== 'recent') {
      driveQuery += ` and '${folderId}' in parents`;
    } else if (!folderId && !filters.search && filters.viewStatus !== 'shared' && filters.viewStatus !== 'starred' && filters.viewStatus !== 'recent' && filters.viewStatus !== 'trash') {
      // If no parent and no search query, get root files
      driveQuery += " and 'root' in parents";
    }
    
    console.log('Final Drive query:', driveQuery);
    
    // Get sort configuration
    const sortKey = getSortKey(filters.sortBy || 'modified');
    const orderBy = filters.viewStatus === 'recent' ? 'viewedByMeTime desc' : 
                   `${sortKey} ${filters.sortOrder}`;

    console.log('Order by:', orderBy);

    const driveService = new GoogleDriveService(accessToken);

    // Make the API call
    const result = await driveService.listFiles({
      query: driveQuery,
      orderBy,
      pageSize,
      pageToken,
      parentId: folderId
    });

    console.log(`Retrieved ${result.files?.length || 0} files from Drive API`);

    // Apply client-side filters
    const filteredFiles = applyClientSideFilters(result.files || [], filters);
    
    console.log(`After client-side filtering: ${filteredFiles.length} files`);

    const finalResult = {
      ...result,
      files: filteredFiles
    };

    // Cache the result
    driveCache.set(cacheKey, finalResult, 5); // Cache for 5 minutes

    return NextResponse.json(finalResult);
    
  } catch (error) {
    console.error('Drive files API error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch files',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
