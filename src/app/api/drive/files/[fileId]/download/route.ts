import { NextRequest, NextResponse } from 'next/server'

import { initDriveService, handleApiError, validateOperationsRequest } from '@/lib/api-utils'
import { retryDriveApiCall } from '@/lib/api-retry'
import { throttledDriveRequest } from '@/lib/api-throttle'

export async function POST(request: NextRequest, { params }: { params: Promise<{ fileId: string }> }) {
  try {
    const { fileId } = await params
    const body = await request.json()

    // Initialize Drive service with authentication
    const authResult = await initDriveService()
    if (!authResult.success) {
      return authResult.response!
    }

    const { driveService } = authResult

    // Handle bulk operations
    if (fileId === 'bulk') {
      if (!validateOperationsRequest(body)) {
        return NextResponse.json({ error: 'Invalid request body for bulk download' }, { status: 400 })
      }

      const { items, downloadMode } = body

      // Filter only files (skip folders automatically)
      const downloadableFiles = items.filter((item: any) => !item.isFolder)
      const skippedFolders = items.filter((item: any) => item.isFolder)

      const results = {
        success: [] as Array<{ id: string; name: string; downloadUrl?: string }>,
        skipped: skippedFolders.map((folder: any) => ({
          id: folder.id,
          name: folder.name,
          reason: 'Not Support',
        })),
        failed: [] as Array<{ id: string; name: string; error: string }>,
        downloadMode,
        timestamp: new Date().toISOString(),
      }

      // Process each file
      for (const file of downloadableFiles) {
        try {
          const downloadResult = await processFileDownload(driveService, file, downloadMode)

          if (downloadResult.success) {
            results.success.push({
              id: file.id,
              name: file.name,
              downloadUrl: downloadResult.downloadUrl,
            })
          } else {
            results.failed.push({
              id: file.id,
              name: file.name,
              error: downloadResult.error || 'Unknown error',
            })
          }
        } catch (error: any) {
          // Handle specific Google Drive API errors
          const errorMessage = getErrorMessage(error)

          // Skip on rate limit or quota errors as per requirement
          if (isSkippableError(error)) {
            results.skipped.push({
              id: file.id,
              name: file.name,
              reason: errorMessage,
            })
          } else {
            results.failed.push({
              id: file.id,
              name: file.name,
              error: errorMessage,
            })
          }
        }
      }

      // For exportLinks mode, generate CSV
      if (downloadMode === 'exportLinks' && results.success.length > 0) {
        const csvContent = generateDownloadCSV(results.success)
        const fileName = `download-${new Date().toISOString().split('T')[0]}.csv`

        return new NextResponse(csvContent, {
          status: 200,
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="${fileName}"`,
          },
        })
      }

      return NextResponse.json(results)
    }

    // Handle single file download - stream directly to browser
    const downloadMode = body.downloadMode || 'oneByOne'

    if (downloadMode === 'exportLinks') {
      // Return Google Drive direct download URL as JSON for CSV generation
      const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`
      return NextResponse.json({
        success: true,
        downloadUrl,
        fileName: `file-${fileId}`,
      })
    }

    // For direct downloads, stream file from Google Drive through our server
    try {
      // Get file metadata first for proper filename
      const metadata = await throttledDriveRequest(async () => {
        return await retryDriveApiCall(async () => {
          return await driveService.getFileMetadata(fileId, ['name', 'mimeType', 'size'])
        })
      })

      // Stream file content
      const fileResponse = await throttledDriveRequest(async () => {
        return await retryDriveApiCall(async () => {
          return await driveService.downloadFile(fileId)
        })
      })

      const fileName = metadata.name
      const mimeType = metadata.mimeType || 'application/octet-stream'

      // Stream file directly to browser
      const headers = new Headers({
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${fileName}"`,
      })

      // Return streaming response
      return new NextResponse(fileResponse as any, {
        status: 200,
        headers,
      })
    } catch (error: any) {
      // Fallback to Google Drive direct URL if streaming fails
      const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`
      return NextResponse.json({
        success: true,
        downloadUrl,
        fileName: `file-${fileId}`,
        fallback: true,
      })
    }
  } catch (error) {
    return handleApiError(error)
  }
}

// Process individual file download - return direct Google Drive URLs
async function processFileDownload(driveService: any, file: any, downloadMode: string) {
  try {
    // Get file metadata first
    const fileMetadata = await throttledDriveRequest(async () => {
      return await retryDriveApiCall(async () => {
        return await driveService.files.get({
          fileId: file.id,
          fields: 'id,name,mimeType,size,webViewLink',
        })
      })
    })

    const fileData = fileMetadata.data

    // Use Google Drive direct download URL for all files
    const downloadUrl = `https://drive.google.com/uc?export=download&id=${file.id}`

    return {
      success: true,
      downloadUrl,
      fileName: fileData.name,
    }
  } catch (error: any) {
    return {
      success: false,
      error: getErrorMessage(error),
    }
  }
}

// Generate CSV content for download links
function generateDownloadCSV(successfulDownloads: Array<{ id: string; name: string; downloadUrl?: string }>) {
  const headers = 'name,link\n'
  const rows = successfulDownloads
    .filter((item) => item.downloadUrl)
    .map((item) => `"${item.name}","${item.downloadUrl}"`)
    .join('\n')

  return headers + rows
}

// Check if file is Google Workspace file that needs export
function isGoogleWorkspaceFile(mimeType: string): boolean {
  return mimeType?.startsWith('application/vnd.google-apps.') || false
}

// Get appropriate export format for Google Workspace files
function getExportFormat(mimeType: string): string {
  const exportMap: { [key: string]: string } = {
    'application/vnd.google-apps.document': 'application/pdf',
    'application/vnd.google-apps.spreadsheet': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.google-apps.presentation':
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.google-apps.drawing': 'image/png',
  }

  return exportMap[mimeType] || 'application/pdf'
}

// Extract user-friendly error message
function getErrorMessage(error: any): string {
  if (error?.response?.data?.error) {
    const apiError = error.response.data.error

    // Handle specific Google Drive API errors
    switch (apiError.code) {
      case 403:
        if (apiError.message?.includes('rateLimitExceeded')) {
          return 'Rate limit exceeded'
        }
        if (apiError.message?.includes('quotaExceeded')) {
          return 'Quota exceeded'
        }
        if (apiError.message?.includes('storageQuotaExceeded')) {
          return 'Storage quota exceeded'
        }
        return 'Access denied'
      case 404:
        return 'File not found'
      case 429:
        return 'Too many requests'
      default:
        return apiError.message || 'Download failed'
    }
  }

  return error?.message || 'Unknown error occurred'
}

// Check if error should cause file to be skipped rather than failed
function isSkippableError(error: any): boolean {
  const errorCode = error?.response?.data?.error?.code
  const errorMessage = error?.response?.data?.error?.message || ''

  return (
    (errorCode === 403 &&
      (errorMessage.includes('rateLimitExceeded') ||
        errorMessage.includes('quotaExceeded') ||
        errorMessage.includes('storageQuotaExceeded'))) ||
    errorCode === 429
  )
}
