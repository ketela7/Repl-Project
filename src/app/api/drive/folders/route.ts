import { NextRequest, NextResponse } from 'next/server'
import { initDriveService, handleApiError } from '@/lib/api-utils'
import { retryDriveApiCall } from '@/lib/api-retry'
import { throttledDriveRequest } from '@/lib/api-throttle'
import { driveCache } from '@/lib/cache'

/**
 * GET /api/drive/folders
 * Fetch folders from Google Drive with optional parent folder filtering
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const parentId = searchParams.get('parentId') || 'root'
    const includeShared = searchParams.get('includeShared') === 'true'

    const authResult = await initDriveService()
    if (!authResult.success) {
      return authResult.response!
    }

    const { session, driveService } = authResult
    const userId = session.user?.email || 'unknown'

    // Check cache first
    const cacheKey = driveCache.generateDriveKey({
      parentId,
      userId,
      query: includeShared ? 'includeShared=true' : 'folders',
    })

    const cached = driveCache.get<{ folders: any[] }>(cacheKey)
    if (cached) {
      return NextResponse.json({
        success: true,
        folders: cached.folders,
        cached: true,
      })
    }

    // Build query for folders only
    let query = `mimeType='application/vnd.google-apps.folder' and trashed=false`

    if (parentId && parentId !== 'root') {
      query += ` and '${parentId}' in parents`
    } else if (parentId === 'root') {
      query += ` and 'root' in parents`
    }

    // Fetch folders with retry mechanism
    const foldersResult = await retryDriveApiCall(async () => {
      return await throttledDriveRequest(async () => {
        return await driveService.drive.files.list({
          q: query,
          fields: 'files(id,name,parents,shared,capabilities,owners,webViewLink,modifiedTime)',
          orderBy: 'name',
          pageSize: 100,
          supportsAllDrives: true,
          includeItemsFromAllDrives: true,
        })
      })
    }, 'List folders')

    const folders = foldersResult.data.files || []

    // Format folder data
    const formattedFolders = folders.map((folder: any) => ({
      id: folder.id,
      name: folder.name,
      isShared: folder.shared || false,
      path: folder.parents ? `Parent: ${folder.parents[0]}` : 'Root',
      webViewLink: folder.webViewLink,
      modifiedTime: folder.modifiedTime,
      canEdit: folder.capabilities?.canEdit || false,
      canAddChildren: folder.capabilities?.canAddChildren || false,
    }))

    // Include shared drives if requested
    let sharedDrives: any[] = []
    if (includeShared && parentId === 'root') {
      try {
        const sharedDrivesResult = await retryDriveApiCall(async () => {
          return await throttledDriveRequest(async () => {
            return await driveService.drive.drives.list({
              fields: 'drives(id,name,capabilities)',
              pageSize: 50,
            })
          })
        }, 'List shared drives')

        sharedDrives = (sharedDrivesResult.data.drives || []).map((drive: any) => ({
          id: drive.id,
          name: `📁 ${drive.name} (Shared Drive)`,
          isShared: true,
          path: 'Shared Drive',
          canEdit: drive.capabilities?.canAddChildren || false,
          canAddChildren: drive.capabilities?.canAddChildren || false,
        }))
      } catch (error) {
        console.warn('Failed to fetch shared drives:', error)
      }
    }

    const allFolders = [...formattedFolders, ...sharedDrives]

    // Cache the result
    driveCache.set(cacheKey, { folders: allFolders }, 5) // 5 minute cache

    return NextResponse.json({
      success: true,
      folders: allFolders,
      total: allFolders.length,
      parentId,
      cached: false,
    })
  } catch (error) {
    console.error('Error in folders API:', error)
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
      return NextResponse.json({ success: false, error: 'Folder name is required' }, { status: 400 })
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
        return await driveService.drive.files.create({
          requestBody: {
            name: name.trim(),
            mimeType: 'application/vnd.google-apps.folder',
            parents: parentId === 'root' ? ['root'] : [parentId],
          },
          fields: 'id,name,parents,webViewLink,createdTime',
        })
      })
    }, 'Create folder')

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
    console.error('Error creating folder:', error)
    return handleApiError(error)
  }
}
