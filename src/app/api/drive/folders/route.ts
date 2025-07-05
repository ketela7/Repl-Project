import { NextRequest, NextResponse } from 'next/server'
import { initDriveService, handleApiError } from '@/lib/api-utils'
import { driveCache } from '@/lib/cache'
import { GoogleDriveService } from '@/lib/google-drive/service'
import { retryDriveApiCall } from '@/lib/api-retry'
import { throttledDriveRequest } from '@/lib/api-throttle'

/**
 * GET /api/drive/folders
 * Search folders from Google Drive with optional filtering and search query
 * Supports both browsing by parentId and searching across all folders
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const parentId = searchParams.get('parentId') || undefined
    const search = searchParams.get('search') || undefined

    const authResult = await initDriveService()
    if (!authResult.success) {
      return authResult.response!
    }

    const { session } = authResult
    const userId = session.user?.email || 'unknown'

    // Create GoogleDriveService instance using session tokens
    const accessToken = (session as any).accessToken
    if (!accessToken) {
      return NextResponse.json(
        { success: false, error: 'No access token available' },
        { status: 401 },
      )
    }

    const driveService = new GoogleDriveService(accessToken)

    // Generate cache key based on search parameters
    const cacheKey = driveCache.generateDriveKey({
      parentId: parentId || 'search',
      userId,
      query: `folders-${search || 'browse'}`,
    })

    // Check cache first (shorter cache for search results)
    const cacheMinutes = search ? 2 : 5 // Shorter cache for search results
    const cached = driveCache.get<{ folders: any[] }>(cacheKey)
    if (cached) {
      return NextResponse.json({
        success: true,
        folders: cached.folders,
        cached: true,
        isSearch: Boolean(search),
      })
    }

    let folders: any[] = []

    if (search) {
      // Search mode: Find folders matching search query across entire Drive
      const searchResult = await driveService.listFiles({
        query: search,
        mimeType: 'application/vnd.google-apps.folder',
        fields: 'id,name,parents,shared,modifiedTime',
        pageSize: 100,
        orderBy: 'name',
      })

      // Filter out trashed folders and format results
      folders = searchResult.files
        .filter(folder => !folder.trashed)
        .map(folder => ({
          id: folder.id,
          name: folder.name,
          isShared: folder.shared || false,
          path: folder.parents?.length ? `Parent: ${folder.parents[0]}` : 'Root',
          modifiedTime: folder.modifiedTime,
        }))
    } else {
      // Browse mode: Get folders in specific parent directory
      const browseResult = await driveService.listFiles({
        parentId: parentId || 'root',
        mimeType: 'application/vnd.google-apps.folder',
        fields: 'id,name,parents,shared,modifiedTime',
        pageSize: 100,
        orderBy: 'name',
      })

      // Filter out trashed folders and format results
      folders = browseResult.files
        .filter(folder => !folder.trashed)
        .map(folder => ({
          id: folder.id,
          name: folder.name,
          isShared: folder.shared || false,
          path: folder.parents?.length ? `Parent: ${folder.parents[0]}` : 'Root',
          modifiedTime: folder.modifiedTime,
        }))
    }

    // listFiles already includes shared drives, no need to fetch separately
    const allFolders = folders

    // Cache the result
    driveCache.set(cacheKey, { folders: allFolders }, cacheMinutes)

    return NextResponse.json({
      success: true,
      folders: allFolders,
      total: allFolders.length,
      parentId: parentId || 'root',
      isSearch: Boolean(search),
      searchQuery: search,
      cached: false,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * POST /api/drive/folders
 * Create a new folder in Google Drive
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, parentId = 'root' } = body

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Folder name is required' },
        { status: 400 },
      )
    }

    const authResult = await initDriveService()
    if (!authResult.success) {
      return authResult.response!
    }

    const { session, driveService } = authResult
    const userId = session.user?.email || 'unknown'

    // Create folder with retry mechanism
    const folderResult = await retryDriveApiCall(async () => {
      return await throttledDriveRequest(async () => {
        return await driveService!.drive.files.create({
          requestBody: {
            name: name.trim(),
            mimeType: 'application/vnd.google-apps.folder',
            parents: parentId === 'root' ? ['root'] : [parentId],
          },
          fields: 'id,name,parents,webViewLink,createdTime',
        })
      })
    })

    const folder = folderResult.data

    // Clear relevant cache entries
    driveCache.clearFolderCache(userId, parentId)
    driveCache.clearUserCache(userId) // Clear user's main cache

    return NextResponse.json({
      success: true,
      folder: {
        id: folder.id,
        name: folder.name,
        parentId: folder.parents?.[0] || 'root',
        webViewLink: folder.webViewLink,
        createdTime: folder.createdTime,
      },
      message: `Folder "${name}" created successfully`,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
