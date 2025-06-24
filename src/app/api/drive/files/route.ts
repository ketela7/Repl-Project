import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { GoogleDriveService } from '@/lib/google-drive/service'
import { driveCache } from '@/lib/cache'
import { requestDeduplicator } from '@/lib/request-deduplication'
import { retryDriveApiCall } from '@/lib/api-retry'
import { apiCall } from '@/lib/api-performance'
import { withErrorHandling } from '@/lib/enhanced-error-handler'

interface FileFilter {
  fileType?: string
  viewStatus?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  search?: string
  minSize?: number
  maxSize?: number
  createdAfter?: string
  createdBefore?: string
  modifiedAfter?: string
  modifiedBefore?: string
  owner?: string
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
      conditions.push('trashed=false')
      conditions.push('sharedWithMe=true')
      break
    case 'starred':
      // Starred view - starred files only
      conditions.push('trashed=false')
      conditions.push('starred=true')
      break
    case 'my-drive':
      // My Drive view - files owned by me
      conditions.push('trashed=false')
      conditions.push("'me' in owners")
      break

    default:
      // All files view - show non-trashed files by default
      conditions.push('trashed=false')
      break
  }

  // File type filters - handle both single and multiple types
  if (filters.fileType && filters.fileType !== 'all') {
    // Handle comma-separated file types from frontend
    const fileTypes = filters.fileType
      .split(',')
      .filter((type) => type && type !== 'all')

    if (fileTypes.length > 0) {
      const typeConditions: string[] = []

      fileTypes.forEach((type) => {
        switch (type.trim()) {
          case 'folder':
            typeConditions.push(
              "mimeType = 'application/vnd.google-apps.folder'"
            )
            break

          case 'shortcut':
            typeConditions.push(
              "mimeType = 'application/vnd.google-apps.shortcut'"
            )
            break

          case 'document':
            typeConditions.push(
              '(' +
                [
                  "mimeType = 'application/vnd.google-apps.document'",
                  "mimeType = 'application/pdf'",
                  "mimeType = 'text/plain'",
                  "mimeType = 'application/msword'",
                  "mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'",
                ].join(' or ') +
                ')'
            )
            break

          case 'spreadsheet':
            typeConditions.push(
              '(' +
                [
                  "mimeType = 'application/vnd.google-apps.spreadsheet'",
                  "mimeType = 'application/vnd.ms-excel'",
                  "mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'",
                ].join(' or ') +
                ')'
            )
            break

          case 'presentation':
            typeConditions.push(
              '(' +
                [
                  "mimeType = 'application/vnd.google-apps.presentation'",
                  "mimeType = 'application/vnd.ms-powerpoint'",
                  "mimeType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation'",
                ].join(' or ') +
                ')'
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
              '(' +
                [
                  "mimeType = 'application/zip'",
                  "mimeType = 'application/x-zip-compressed'",
                  "mimeType = 'application/x-rar-compressed'",
                  "mimeType = 'application/vnd.rar'",
                  "mimeType = 'application/x-7z-compressed'",
                  "mimeType = 'application/x-tar'",
                  "mimeType = 'application/gzip'",
                  "mimeType = 'application/x-bzip2'",
                  "mimeType = 'application/x-xz'",
                ].join(' or ') +
                ')'
            )
            break

          case 'code':
            typeConditions.push(
              '(' +
                [
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
                ].join(' or ') +
                ')'
            )
            break

          case 'drawing':
            typeConditions.push(
              "mimeType = 'application/vnd.google-apps.drawing'"
            )
            break

          case 'form':
            typeConditions.push("mimeType = 'application/vnd.google-apps.form'")
            break

          case 'jamboard':
            typeConditions.push("mimeType = 'application/vnd.google-apps.jam'")
            break

          case 'script':
            typeConditions.push(
              "mimeType = 'application/vnd.google-apps.script'"
            )
            break

          case 'site':
            typeConditions.push("mimeType = 'application/vnd.google-apps.site'")
            break

          case 'map':
            typeConditions.push("mimeType = 'application/vnd.google-apps.map'")
            break

          case 'photo':
            typeConditions.push(
              "mimeType = 'application/vnd.google-apps.photo'"
            )
            break

          case 'google-native':
            typeConditions.push(
              "mimeType contains 'application/vnd.google-apps'"
            )
            break

          case 'pdf':
            typeConditions.push("mimeType = 'application/pdf'")
            break

          case 'text':
            typeConditions.push(
              '(' +
                [
                  "mimeType = 'text/plain'",
                  "mimeType = 'text/markdown'",
                  "mimeType = 'text/csv'",
                  "mimeType = 'text/tab-separated-values'",
                ].join(' or ') +
                ')'
            )
            break

          case 'design':
            typeConditions.push(
              '(' +
                [
                  "mimeType = 'application/vnd.google-apps.drawing'",
                  "mimeType = 'image/svg+xml'",
                  "mimeType = 'application/postscript'",
                  "mimeType = 'application/illustrator'",
                ].join(' or ') +
                ')'
            )
            break

          case 'database':
            typeConditions.push(
              '(' +
                [
                  "mimeType = 'application/x-sqlite3'",
                  "mimeType = 'application/vnd.ms-access'",
                  "mimeType = 'application/x-dbf'",
                  "mimeType contains 'database'",
                ].join(' or ') +
                ')'
            )
            break

          case 'ebook':
            typeConditions.push(
              '(' +
                [
                  "mimeType = 'application/epub+zip'",
                  "mimeType = 'application/x-mobipocket-ebook'",
                  "mimeType = 'application/vnd.amazon.ebook'",
                  "mimeType = 'application/x-fictionbook+xml'",
                ].join(' or ') +
                ')'
            )
            break

          case 'font':
            typeConditions.push(
              '(' +
                [
                  "mimeType = 'font/ttf'",
                  "mimeType = 'font/otf'",
                  "mimeType = 'font/woff'",
                  "mimeType = 'font/woff2'",
                  "mimeType = 'application/font-woff'",
                ].join(' or ') +
                ')'
            )
            break

          case 'calendar':
            typeConditions.push(
              '(' +
                [
                  "mimeType = 'text/calendar'",
                  "mimeType = 'application/ics'",
                ].join(' or ') +
                ')'
            )
            break

          case 'contact':
            typeConditions.push(
              '(' +
                ["mimeType = 'text/vcard'", "mimeType = 'text/x-vcard'"].join(
                  ' or '
                ) +
                ')'
            )
            break

          case 'other':
            typeConditions.push(
              '(' +
                [
                  "not mimeType contains 'application/vnd.google-apps'",
                  "not mimeType contains 'image/'",
                  "not mimeType contains 'video/'",
                  "not mimeType contains 'audio/'",
                  "not mimeType contains 'text/'",
                  "not mimeType contains 'application/pdf'",
                  "not mimeType contains 'zip'",
                  "not mimeType contains 'archive'",
                ].join(' and ') +
                ')'
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

  // Size filter - only apply to files, not folders
  if (filters.minSize || filters.maxSize) {
    const fileSizeConditions = []
    if (filters.minSize) {
      fileSizeConditions.push(`size >= ${filters.minSize}`)
    }
    if (filters.maxSize) {
      fileSizeConditions.push(`size <= ${filters.maxSize}`)
    }

    // Check if folders are included in file type filter
    const includesFolders =
      filters.fileType &&
      filters.fileType !== 'all' &&
      (filters.fileType.includes('folder') || filters.fileType === 'folder')

    if (fileSizeConditions.length > 0) {
      if (includesFolders) {
        // If folders are requested, create OR condition: (size filters for files) OR (folders)
        conditions.push(
          `(((${fileSizeConditions.join(' and ')}) and not mimeType = 'application/vnd.google-apps.folder') or mimeType = 'application/vnd.google-apps.folder')`
        )
      } else {
        // If no folders requested, just apply size filters normally
        conditions.push(fileSizeConditions.join(' and '))
      }
    }
  }

  return conditions.join(' and ')
}

// Removed applyClientSideFilters - now using Google Drive API directly with proper query parameters

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
  return await withErrorHandling(async () => {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = session.user
    if (process.env.NODE_ENV === 'development') {
    }

    const accessToken = session.accessToken

    if (!accessToken) {
      if (process.env.NODE_ENV === 'development') {
      }
      return NextResponse.json(
        {
          error: 'No access token found',
          needsReauth: true,
        },
        { status: 401 }
      )
    }

    if (process.env.NODE_ENV === 'development') {
    }

    const { searchParams } = new URL(request.url)

    // Parse and validate query parameters
    const pageSize = Math.min(
      Math.max(parseInt(searchParams.get('pageSize') || '50'), 1),
      1000
    )
    const sortOrder = searchParams.get('sortOrder')
    const validateSortOrder = (order: string | null): 'asc' | 'desc' => {
      return order === 'asc' || order === 'desc' ? order : 'desc'
    }

    const filters: FileFilter = {
      fileType:
        searchParams.get('fileTypes') || searchParams.get('fileType') || 'all',
      viewStatus:
        searchParams.get('viewStatus') || searchParams.get('view') || 'all',
      sortBy: searchParams.get('sortBy') || 'modified',
      sortOrder: validateSortOrder(sortOrder),
      search:
        searchParams.get('search') || searchParams.get('query') || undefined,
      minSize:
        searchParams.get('sizeMin') || searchParams.get('minSize')
          ? Math.max(
              parseInt(
                searchParams.get('sizeMin') || searchParams.get('minSize')!
              ) || 0,
              0
            )
          : undefined,
      maxSize:
        searchParams.get('sizeMax') || searchParams.get('maxSize')
          ? Math.max(
              parseInt(
                searchParams.get('sizeMax') || searchParams.get('maxSize')!
              ) || 0,
              0
            )
          : undefined,
      createdAfter: searchParams.get('createdAfter') || undefined,
      createdBefore: searchParams.get('createdBefore') || undefined,
      modifiedAfter: searchParams.get('modifiedAfter') || undefined,
      modifiedBefore: searchParams.get('modifiedBefore') || undefined,
      owner: searchParams.get('owner') || undefined,
    }

    // Properly decode pageToken to handle URL encoding issues
    let pageToken = searchParams.get('pageToken') || undefined
    if (pageToken) {
      try {
        // Handle double-encoded pageTokens
        let decodedToken = pageToken

        // Keep decoding until we get a stable result or hit limit
        let attempts = 0
        while (decodedToken.includes('%') && attempts < 3) {
          const previousToken = decodedToken
          decodedToken = decodeURIComponent(decodedToken)
          attempts++

          // If decoding doesn't change the token, we're done
          if (previousToken === decodedToken) {
            break
          }
        }

        pageToken = decodedToken

        // Validate the final pageToken
        if (pageToken.length > 1000 || /[<>{}\\|\s]/.test(pageToken)) {
          pageToken = undefined
        }
      } catch (error) {
        pageToken = undefined
      }
    }

    const folderId =
      searchParams.get('folderId') || searchParams.get('parentId') || undefined

    if (process.env.NODE_ENV === 'development') {
    }

    // Check cache first - include viewStatus in cache key for proper filtering
    const cacheKey = driveCache.generateDriveKey({
      pageToken,
      parentId: folderId,
      userId: user.email || 'unknown',
      viewStatus: filters.viewStatus,
      fileType: filters.fileType,
      search: filters.search,
    })

    // Build the Drive API query using the consolidated function
    let driveQuery = buildDriveQuery(filters)

    // Add parent folder constraint if needed
    if (folderId) {
      // When navigating into a specific folder, show its contents regardless of view
      driveQuery = 'trashed=false' // Reset query for folder contents
      driveQuery += ` and '${folderId}' in parents`
    } // else if (!folderId && !filters.search) {
    // For special views (starred, shared, trash), don't add parent restrictions
    //  if (filters.viewStatus === 'my-drive') {
    //    driveQuery += " and 'root' in parents";
    //  }
    // For starred, shared, trash views - no parent restriction needed
    //   }
    // For "All Files" view (when viewStatus is 'all' or not specified), show everything without parent restriction

    if (process.env.NODE_ENV === 'development') {
    }

    // Get sort configuration
    const sortKey = getSortKey(filters.sortBy || 'modified')
    const orderBy =
      filters.viewStatus === 'recent'
        ? 'viewedByMeTime desc, modifiedTime desc'
        : `${sortKey} ${filters.sortOrder}`

    if (process.env.NODE_ENV === 'development') {
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
      pageToken: pageToken,
    })

    {
      /*// Use search optimization for search queries
                if (filters.search) {
      const searchResult = await searchOptimizer.optimizedSearch(
        filters.search,
        user.email!,
        async () => {
          const driveService = new GoogleDriveService(accessToken)
          return await retryDriveApiCall(
            () =>
              driveService.listFiles({
                query: driveQuery,
                orderBy,
                pageSize,
                pageToken,
                parentId: folderId,
              }),
            `Drive API search for "${filters.search}" for user ${user.email}${folderId ? ` in folder ${folderId}` : ''}`
          )
        },
        folderId
      )

      // Apply client-side filters to search results
      const filteredFiles = applyClientSideFilters(searchResult.files, filters)

      if (process.env.NODE_ENV === 'development') {
          `Search "${filters.search}": ${searchResult.files.length} -> ${filteredFiles.length} files after filtering`
        )
      }

      return NextResponse.json({
        files: filteredFiles,
        nextPageToken: searchResult.nextPageToken,
        totalCount: filteredFiles.length,
      })
    }
                */
    }
    // Check cache first - before deduplication
    const cachedData = driveCache.get(cacheKey)
    if (cachedData) {
      if (process.env.NODE_ENV === 'development') {
      }

      // Direct API filtering from cache


      return NextResponse.json({
        files: (cachedData as any)?.files || [],
        nextPageToken: (cachedData as any)?.nextPageToken,
        totalCount: (cachedData as any)?.files?.length || 0,
      })
    }

    // Use optimized API call with performance enhancements
    const result = await apiCall(
      deduplicationKey,
      async () => {
        const driveService = new GoogleDriveService(accessToken)

        const apiResult = await retryDriveApiCall(
          () =>
            driveService.listFiles({
              query: driveQuery,
              orderBy,
              pageSize,
              pageToken,
              parentId: folderId,
            }),
          `Drive API listFiles for user ${user.email}`
        )

        // Cache with extended TTL for better performance
        driveCache.set(cacheKey, apiResult, 15) // Cache for 15 minutes

        return apiResult
      },
      'high'
    )

    if (process.env.NODE_ENV === 'development') {
    }

    // Direct API filtering - no client-side processing needed
    const finalResult = {
      ...result,
      files: result.files || [],
    }



    return NextResponse.json(finalResult)
  }, 'drive-files-list', false)
}
