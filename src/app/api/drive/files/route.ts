import { NextRequest, NextResponse } from 'next/server'

import { initDriveService } from '@/lib/api-utils'
import { driveCache } from '@/lib/cache'

interface FileFilter {
  fileType?: string
  viewStatus?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  search?: string
  createdAfter?: string
  createdBefore?: string
  modifiedAfter?: string
  modifiedBefore?: string
  owner?: string
  sizeMin?: string
  sizeMax?: string
}

function buildDriveQuery(filters: FileFilter): string {
  const conditions: string[] = []

  // Handle view status filters according to Google Drive API documentation
  switch (filters.viewStatus) {
    case 'trash':
      // Trash view - show only trashed files
      conditions.push('trashed=true')
      break
    case 'shared':
      // Shared with me view - files shared by others
      //conditions.push('trashed=false')
      conditions.push('sharedWithMe=true')
      break
    case 'starred':
      // Starred view - starred files only
      //conditions.push('trashed=false')
      conditions.push('starred=true')
      break
    case 'my-drive':
      // My Drive view - files owned by me
      //conditions.push('trashed=false')
      conditions.push("'me' in owners")
      break
    case 'recent':
      // Recent view - recently modified files on 30 days ago
      //conditions.push('trashed=false')
      conditions.push(
        `modifiedTime > '${new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()}'`,
      )
    //break
    //case 'all':
    //default:
    // All files view - show non-trashed files by default
    //conditions.push('trashed=false')
    //break
  }

  // File type filters - handle both single and multiple types
  if (filters.fileType && filters.fileType !== 'all') {
    // Handle comma-separated file types from frontend
    const fileTypes = filters.fileType.split(',').filter(type => type && type !== 'all')

    if (fileTypes.length > 0) {
      const typeConditions: string[] = []

      fileTypes.forEach(type => {
        switch (type.trim()) {
          case 'folder':
            typeConditions.push("mimeType = 'application/vnd.google-apps.folder'")
            break

          case 'shortcut':
            typeConditions.push("mimeType = 'application/vnd.google-apps.shortcut'")
            break

          case 'document':
            typeConditions.push(
              `(${[
                "mimeType = 'application/vnd.google-apps.document'",
                "mimeType = 'application/pdf'",
                "mimeType = 'text/plain'",
                "mimeType = 'application/msword'",
                "mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'",
              ].join(' or ')})`,
            )
            break

          case 'spreadsheet':
            typeConditions.push(
              `(${[
                "mimeType = 'application/vnd.google-apps.spreadsheet'",
                "mimeType = 'application/vnd.ms-excel'",
                "mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'",
              ].join(' or ')})`,
            )
            break

          case 'presentation':
            typeConditions.push(
              `(${[
                "mimeType = 'application/vnd.google-apps.presentation'",
                "mimeType = 'application/vnd.ms-powerpoint'",
                "mimeType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation'",
              ].join(' or ')})`,
            )
            break

          case 'image':
            typeConditions.push("mimeType contains 'image/'")
            break

          case 'video':
            typeConditions.push("mimeType contains 'video/'")
            break

          case 'audio':
            typeConditions.push("mimeType contains 'audio/'")
            break

          case 'archive':
            typeConditions.push(
              `(${[
                "mimeType = 'application/zip'",
                "mimeType = 'application/x-zip-compressed'",
                "mimeType = 'application/x-rar-compressed'",
                "mimeType = 'application/vnd.rar'",
                "mimeType = 'application/x-7z-compressed'",
                "mimeType = 'application/x-tar'",
                "mimeType = 'application/gzip'",
                "mimeType = 'application/x-bzip2'",
                "mimeType = 'application/x-xz'",
              ].join(' or ')})`,
            )
            break

          case 'code':
            typeConditions.push(
              `(${[
                "mimeType = 'text/javascript'",
                "mimeType = 'application/javascript'",
                "mimeType = 'text/x-python'",
                "mimeType = 'text/x-c'",
                "mimeType = 'text/x-c++'",
                "mimeType = 'text/x-java-source'",
                "mimeType = 'application/json'",
                "mimeType = 'application/xml'",
                "mimeType = 'text/html'",
                "mimeType = 'text/css'",
                "mimeType contains 'text/x-'",
                "mimeType contains 'application/x-'",
              ].join(' or ')})`,
            )
            break

          case 'drawing':
            typeConditions.push("mimeType = 'application/vnd.google-apps.drawing'")
            break

          case 'form':
            typeConditions.push("mimeType = 'application/vnd.google-apps.form'")
            break

          case 'jamboard':
            typeConditions.push("mimeType = 'application/vnd.google-apps.jam'")
            break

          case 'script':
            typeConditions.push("mimeType = 'application/vnd.google-apps.script'")
            break

          case 'site':
            typeConditions.push("mimeType = 'application/vnd.google-apps.site'")
            break

          case 'map':
            typeConditions.push("mimeType = 'application/vnd.google-apps.map'")
            break

          case 'photo':
            typeConditions.push("mimeType = 'application/vnd.google-apps.photo'")
            break

          case 'google-native':
            typeConditions.push("mimeType contains 'application/vnd.google-apps'")
            break

          case 'pdf':
            typeConditions.push("mimeType = 'application/pdf'")
            break

          case 'text':
            typeConditions.push(
              `(${[
                "mimeType = 'text/plain'",
                "mimeType = 'text/markdown'",
                "mimeType = 'text/csv'",
                "mimeType = 'text/tab-separated-values'",
              ].join(' or ')})`,
            )
            break

          case 'design':
            typeConditions.push(
              `(${[
                "mimeType = 'application/vnd.google-apps.drawing'",
                "mimeType = 'image/svg+xml'",
                "mimeType = 'application/postscript'",
                "mimeType = 'application/illustrator'",
              ].join(' or ')})`,
            )
            break

          case 'database':
            typeConditions.push(
              `(${[
                "mimeType = 'application/x-sqlite3'",
                "mimeType = 'application/vnd.ms-access'",
                "mimeType = 'application/x-dbf'",
                "mimeType contains 'database'",
              ].join(' or ')})`,
            )
            break

          case 'ebook':
            typeConditions.push(
              `(${[
                "mimeType = 'application/epub+zip'",
                "mimeType = 'application/x-mobipocket-ebook'",
                "mimeType = 'application/vnd.amazon.ebook'",
                "mimeType = 'application/x-fictionbook+xml'",
              ].join(' or ')})`,
            )
            break

          case 'font':
            typeConditions.push(
              `(${[
                "mimeType = 'font/ttf'",
                "mimeType = 'font/otf'",
                "mimeType = 'font/woff'",
                "mimeType = 'font/woff2'",
                "mimeType = 'application/font-woff'",
              ].join(' or ')})`,
            )
            break

          case 'calendar':
            typeConditions.push(
              `(${["mimeType = 'text/calendar'", "mimeType = 'application/ics'"].join(' or ')})`,
            )
            break

          case 'contact':
            typeConditions.push(
              `(${["mimeType = 'text/vcard'", "mimeType = 'text/x-vcard'"].join(' or ')})`,
            )
            break

          case 'other':
            typeConditions.push(
              `(${[
                "not mimeType contains 'application/vnd.google-apps'",
                "not mimeType contains 'image/'",
                "not mimeType contains 'video/'",
                "not mimeType contains 'audio/'",
                "not mimeType contains 'text/'",
                "not mimeType contains 'application/pdf'",
                "not mimeType contains 'zip'",
                "not mimeType contains 'archive'",
              ].join(' and ')})`,
            )
            break
        }
      })

      if (typeConditions.length > 0) {
        conditions.push(`(${typeConditions.join(' or ')})`)
      }
    }
  }

  // Search query with proper sanitization
  if (filters.search) {
    const searchTerm = filters.search
      .replace(/['"\\]/g, '') // Remove quotes and backslashes
      .trim()
      .substring(0, 100) // Limit length
    if (searchTerm) {
      conditions.push(`name contains '${searchTerm}'`)
    }
  }

  // Date filters
  if (filters.createdAfter) {
    conditions.push(`createdTime >= '${filters.createdAfter}'`)
  }
  if (filters.createdBefore) {
    conditions.push(`createdTime <= '${filters.createdBefore}'`)
  }
  if (filters.modifiedAfter) {
    conditions.push(`modifiedTime >= '${filters.modifiedAfter}'`)
  }
  if (filters.modifiedBefore) {
    conditions.push(`modifiedTime <= '${filters.modifiedBefore}'`)
  }

  // Owner filter by email
  if (filters.owner) {
    conditions.push(`'${filters.owner}' in owners`)
  }

  // Size filtering - Google Drive API doesn't support size operators in query
  // We'll handle size filtering on the client side after fetching results
  // Only exclude folders when size filters are specified since they don't have meaningful sizes
  if (filters.sizeMin || filters.sizeMax) {
    conditions.push("mimeType != 'application/vnd.google-apps.folder'")
  }

  return conditions.join(' and ')
}

function getSortKey(sortBy: string) {
  switch (sortBy) {
    case 'name':
      return 'name'
    case 'modified':
      return 'modifiedTime'
    case 'created':
      return 'createdTime'
    case 'size':
      return 'size'
    default:
      return 'modifiedTime'
  }
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await initDriveService()
    if (!authResult.success) {
      return authResult.response!
    }

    const { session, driveService } = authResult

    const { searchParams } = new URL(request.url)
    const fileId = searchParams.get('fileId')

    // If fileId is provided, return single file metadata (used by breadcrumb)
    if (fileId) {
      const fileMetadata = await driveService!.getFileMetadata(fileId, [
        'id',
        'name',
        'parents',
        'mimeType',
      ])

      // Ensure id is always included in response
      const response = {
        ...fileMetadata,
        id: fileMetadata.id || fileId, // Fallback to requested fileId if id is missing
      }

      // // // // // console.log('[Drive API] Single file response:', response)
      // // // // // console.log('[Drive API] File ID check:', { requestedId: fileId, responseId: response.id })

      return NextResponse.json(response)
    }

    // Otherwise, list folder contents
    const pageSize = Math.min(Number(searchParams.get('pageSize')) || 50, 1000)
    const pageToken = searchParams.get('pageToken') || undefined
    const folderIdParam = searchParams.get('folderId')
    const folderId = folderIdParam || 'root'

    const filters: FileFilter = {
      fileType: searchParams.get('fileType') || 'all',
      viewStatus: searchParams.get('viewStatus') || 'all',
      ...(searchParams.get('sortBy') && { sortBy: searchParams.get('sortBy')! }),
      sortOrder: searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc',
      ...(searchParams.get('search') && { search: searchParams.get('search')! }),
      ...(searchParams.get('createdAfter') && { createdAfter: searchParams.get('createdAfter')! }),
      ...(searchParams.get('createdBefore') && {
        createdBefore: searchParams.get('createdBefore')!,
      }),
      ...(searchParams.get('modifiedAfter') && {
        modifiedAfter: searchParams.get('modifiedAfter')!,
      }),
      ...(searchParams.get('modifiedBefore') && {
        modifiedBefore: searchParams.get('modifiedBefore')!,
      }),
      ...(searchParams.get('owner') && { owner: searchParams.get('owner')! }),
      ...(searchParams.get('sizeMin') && { sizeMin: searchParams.get('sizeMin')! }),
      ...(searchParams.get('sizeMax') && { sizeMax: searchParams.get('sizeMax')! }),
    }

    const baseQuery = buildDriveQuery(filters)

    // Build query with parent constraints
    let query = baseQuery

    // Handle different view types with proper parent constraints
    if (folderIdParam) {
      // When navigating to specific folder, always apply parent constraint
      const parentQuery = folderId !== 'root' ? `'${folderId}' in parents` : "'root' in parents"
      query = query ? `${query} and ${parentQuery}` : parentQuery
    } else if (filters.viewStatus === 'my-drive') {
      // My Drive view without folder navigation - show root folder
      const parentQuery = "'root' in parents"
      query = query ? `${query} and ${parentQuery}` : parentQuery
    } else {
      // Other views (shared, starred, recent, etc.)
      // These views search across entire Drive without parent constraints
      // They already have their specific filters from buildDriveQuery
      // No parent constraint needed - search globally
    }

    const sortKey = getSortKey(filters.sortBy || 'modified')
    const orderBy = `${sortKey} ${filters.sortOrder}`

    const cacheKey = driveCache.generateDriveKey({
      parentId: folderId,
      userId: session.user?.email,
      ...(pageToken && { pageToken }),
      query,
      pageSize,
    })

    // For folder navigation, bypass cache if no pageToken (first page)
    // This ensures fresh data when navigating between folders
    const shouldUseCache = pageToken !== undefined
    const cachedData = shouldUseCache ? driveCache.get(cacheKey) : null
    if (cachedData) {
      return NextResponse.json(cachedData)
    }

    // // // // // console.log('[Drive API] Request details:', {
    //   folderId,
    //   viewStatus: filters.viewStatus,
    //   query,
    // })

    // Pass the complete query to the Drive service
    const result = await driveService!.listFiles({
      query,
      ...(pageToken && { pageToken }),
      pageSize,
      orderBy,
    })

    // Apply client-side size filtering since Google Drive API doesn't support size operators
    if (filters.sizeMin || filters.sizeMax) {
      const sizeMin = filters.sizeMin ? Number(filters.sizeMin) : 0
      const sizeMax = filters.sizeMax ? Number(filters.sizeMax) : Number.MAX_SAFE_INTEGER

      result.files = result.files.filter((file: any) => {
        const fileSize = file.size ? Number(file.size) : 0
        return fileSize >= sizeMin && fileSize <= sizeMax
      })
    }

    driveCache.set(cacheKey, result)

    return NextResponse.json(result)
  } catch (error: any) {
    //// // // // // console.error('Drive API Error:', error)

    // Handle authentication errors
    if (error.name === 'AuthenticationError' || error.code === 401) {
      return NextResponse.json(
        {
          error: 'Authentication expired',
          needsReauth: true,
          redirect: '/auth/v1/login?reauth=drive&callbackUrl=/dashboard/drive',
        },
        { status: 401 },
      )
    }

    // Handle permission errors
    if (error.name === 'PermissionError' || error.code === 403) {
      return NextResponse.json(
        {
          error: 'Insufficient Drive permissions',
          needsReauth: true,
          redirect: '/auth/v1/login?reauth=drive&callbackUrl=/dashboard/drive',
        },
        { status: 403 },
      )
    }

    return NextResponse.json({ error: 'Failed to fetch files' }, { status: 500 })
  }
}
