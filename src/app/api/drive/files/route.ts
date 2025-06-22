
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { GoogleDriveService } from '@/lib/google-drive/service';
import { driveCache } from '@/lib/cache';
import { requestDeduplicator } from '@/lib/request-deduplication';
import { retryDriveApiCall } from '@/lib/api-retry';
import { searchOptimizer } from '@/lib/search-optimizer';
import { getCachedSession } from '@/lib/session-cache';

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
          case 'shortcut':
            typeConditions.push('mimeType=\'application/vnd.google-apps.shortcut\'');
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
  
  // Search query with proper sanitization
  if (filters.search) {
    const searchTerm = filters.search
      .replace(/['"\\]/g, '') // Remove quotes and backslashes
      .trim()
      .substring(0, 100); // Limit length
    if (searchTerm) {
      conditions.push(`name contains '${searchTerm}'`);
    }
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
    if (process.env.NODE_ENV === 'development') {
      console.log('=== Drive Files API Called ===');
    }
    
    const session = await getCachedSession(request.headers, () => auth());
    
    if (!session?.user) {
      if (process.env.NODE_ENV === 'development') {
        console.log('No session found');
      }
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user;
    if (process.env.NODE_ENV === 'development') {
      console.log('User found:', user.email);
    }

    const accessToken = session.accessToken;
    
    if (!accessToken) {
      if (process.env.NODE_ENV === 'development') {
        console.log('No access token found');
      }
      return NextResponse.json({ 
        error: 'No access token found',
        needsReauth: true 
      }, { status: 401 });
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('Access token found, proceeding with Drive API call');
    }

    const { searchParams } = new URL(request.url);
    
    // Parse and validate query parameters
    const pageSize = Math.min(Math.max(parseInt(searchParams.get('pageSize') || '50'), 1), 1000);
    const sortOrder = searchParams.get('sortOrder');
    const validateSortOrder = (order: string | null): 'asc' | 'desc' => {
      return order === 'asc' || order === 'desc' ? order : 'desc';
    };

    const filters: FileFilter = {
      fileType: searchParams.get('fileTypes') || searchParams.get('fileType') || 'all',
      viewStatus: searchParams.get('view') || searchParams.get('viewStatus') || 'all',
      sortBy: searchParams.get('sortBy') || 'modified',
      sortOrder: validateSortOrder(sortOrder),
      search: searchParams.get('search') || searchParams.get('query') || undefined,
      minSize: searchParams.get('sizeMin') || searchParams.get('minSize') ? 
        Math.max(parseInt(searchParams.get('sizeMin') || searchParams.get('minSize')!) || 0, 0) : undefined,
      maxSize: searchParams.get('sizeMax') || searchParams.get('maxSize') ? 
        Math.max(parseInt(searchParams.get('sizeMax') || searchParams.get('maxSize')!) || 0, 0) : undefined,
      createdAfter: searchParams.get('createdAfter') || undefined,
      createdBefore: searchParams.get('createdBefore') || undefined,
      modifiedAfter: searchParams.get('modifiedAfter') || undefined,
      modifiedBefore: searchParams.get('modifiedBefore') || undefined,
      owner: searchParams.get('owner') || undefined,
    };

    const pageToken = searchParams.get('pageToken') || undefined;
    const folderId = searchParams.get('folderId') || searchParams.get('parentId') || undefined;

    if (process.env.NODE_ENV === 'development') {
      console.log('Filters applied:', filters);
    }

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
    if (folderId) {
      // When navigating into a specific folder, show its contents regardless of view
      driveQuery = 'trashed=false';  // Reset query for folder contents
      driveQuery += ` and '${folderId}' in parents`;
        //} else if (!folderId && !filters.search && filters.viewStatus !== 'shared' && filters.viewStatus !== 'starred' && filters.viewStatus !== 'recent' && filters.viewStatus !== 'trash') {
    } else if (!folderId && !filters.search && filters.viewStatus === 'my-drive') {
      // Only restrict to root for "My Drive" view specifically
      driveQuery += " and 'root' in parents";
    }
    // For "All Files" view (when viewStatus is 'all' or not specified), show everything without parent restriction
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Final Drive query:', driveQuery);
    }
    
    // Get sort configuration
    const sortKey = getSortKey(filters.sortBy || 'modified');
    const orderBy = filters.viewStatus === 'recent' ? 'viewedByMeTime desc' : 
                   `${sortKey} ${filters.sortOrder}`;

    if (process.env.NODE_ENV === 'development') {
      console.log('Order by:', orderBy);
    }

    // Generate deduplication key to prevent multiple identical requests
    const deduplicationKey = requestDeduplicator.generateDriveFilesKey({
      userId: user.email!,
      pageSize,
      fileType: filters.fileType,
      viewStatus: filters.viewStatus,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder,
      search: filters.search,
      folderId: folderId,
      pageToken: pageToken
    });

    // Use search optimization for search queries
    if (filters.search) {
      const searchResult = await searchOptimizer.optimizedSearch(
        filters.search,
        user.email!,
        async () => {
          const driveService = new GoogleDriveService(accessToken);
          return await retryDriveApiCall(
            () => driveService.listFiles({
              query: driveQuery,
              orderBy,
              pageSize,
              pageToken,
              parentId: folderId
            }),
            `Drive API search for "${filters.search}" for user ${user.email}${folderId ? ` in folder ${folderId}` : ''}`
          );
        },
        folderId
      );
      
      // Apply client-side filters to search results
      const filteredFiles = applyClientSideFilters(searchResult.files, filters);
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`Search "${filters.search}": ${searchResult.files.length} -> ${filteredFiles.length} files after filtering`);
      }

      return NextResponse.json({
        files: filteredFiles,
        nextPageToken: searchResult.nextPageToken,
        totalCount: filteredFiles.length
      });
    }

    // Check cache first - before deduplication
    const cachedData = driveCache.get(cacheKey);
    if (cachedData) {
      if (process.env.NODE_ENV === 'development') {
        console.log('Cache hit for:', cacheKey);
      }
      
      // Apply client-side filters to cached results
      const filteredFiles = applyClientSideFilters(cachedData.files, filters);
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`Retrieved ${cachedData.files.length} files from Drive API`);
        console.log(`After client-side filtering: ${filteredFiles.length} files`);
      }

      return NextResponse.json({
        files: filteredFiles,
        nextPageToken: cachedData.nextPageToken,
        totalCount: filteredFiles.length
      });
    }

    // Use request deduplication only for uncached requests
    const result = await requestDeduplicator.deduplicate(deduplicationKey, async () => {
      const driveService = new GoogleDriveService(accessToken);

      // Make the actual API call with retry mechanism
      const apiResult = await retryDriveApiCall(
        () => driveService.listFiles({
          query: driveQuery,
          orderBy,
          pageSize,
          pageToken,
          parentId: folderId
        }),
        `Drive API listFiles for user ${user.email}`
      );

      // Cache the result
      driveCache.set(cacheKey, apiResult, 5); // Cache for 5 minutes
      
      return apiResult;
    });

    if (process.env.NODE_ENV === 'development') {
      console.log(`Retrieved ${result.files?.length || 0} files from Drive API`);
    }

    // Apply client-side filters
    const filteredFiles = applyClientSideFilters(result.files || [], filters);
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`After client-side filtering: ${filteredFiles.length} files`);
    }

    const finalResult = {
      ...result,
      files: filteredFiles
    };

    return NextResponse.json(finalResult);
    
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Drive files API error:', error);
    }
    return NextResponse.json({ 
      error: 'Failed to fetch files'
      // Don't expose error details in production for security
    }, { status: 500 });
  }
}
