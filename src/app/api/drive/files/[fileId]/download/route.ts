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

      const fileName = metadata.name
      const mimeType = metadata.mimeType || 'application/octet-stream'

      // Check if it's a Google Workspace file that needs export
      if (isGoogleWorkspaceFile(mimeType)) {
        const exportMimeType = getExportFormat(mimeType)
        const exportExtension = getFileExtension(exportMimeType)
        
        // Export Google Workspace file
        const exportBuffer = await throttledDriveRequest(async () => {
          return await retryDriveApiCall(async () => {
            return await driveService.exportFile(fileId, exportMimeType)
          })
        })

        const uint8Array = new Uint8Array(exportBuffer)
        const exportFileName = `${fileName}.${exportExtension}`

        return new NextResponse(uint8Array, {
          status: 200,
          headers: {
            'Content-Type': exportMimeType,
            'Content-Disposition': `attachment; filename="${exportFileName}"`,
            'Content-Length': uint8Array.length.toString(),
          },
        })
      }

      // For regular files, stream directly
      const fileStream = await throttledDriveRequest(async () => {
        return await retryDriveApiCall(async () => {
          return await driveService.downloadFile(fileId)
        })
      })

      // Convert Node.js Readable to Web ReadableStream
      const { Readable } = await import('stream')
      const webStream = Readable.toWeb(fileStream)

      // Stream file directly to browser
      return new NextResponse(webStream, {
        status: 200,
        headers: {
          'Content-Type': mimeType,
          'Content-Disposition': `attachment; filename="${fileName}"`,
        },
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

// Get file extension from mime type
function getFileExtension(mimeType: string): string {
  const extensionMap: { [key: string]: string } = {
    'application/pdf': 'pdf',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'text/plain': 'txt',
    'text/csv': 'csv',
  }

  return extensionMap[mimeType] || 'pdf'
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
