import { NextRequest, NextResponse } from 'next/server'

import { initDriveService, handleApiError, validateOperationsRequest } from '@/lib/api-utils'
import { retryDriveApiCall } from '@/lib/api-retry'
import { throttledDriveRequest } from '@/lib/api-throttle'

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const fileId = url.searchParams.get('fileId')
    const mode = url.searchParams.get('mode')
    const fileName = url.searchParams.get('fileName')

    if (!fileId) {
      return NextResponse.json({ error: 'fileId is required' }, { status: 400 })
    }

    // For direct streaming mode
    if (mode === 'stream') {
      // Initialize Drive service with authentication
      const authResult = await initDriveService()
      if (!authResult.success) {
        return authResult.response!
      }

      const { driveService } = authResult

      try {
        // Get file metadata first for proper filename and content type
        const metadata = await throttledDriveRequest(async () => {
          return await retryDriveApiCall(async () => {
            return await driveService.getFileMetadata(fileId, ['name', 'mimeType', 'size'])
          })
        })

        const actualFileName = fileName || metadata.name
        const mimeType = metadata.mimeType || 'application/octet-stream'
        const fileSize = metadata.size ? parseInt(metadata.size) : undefined

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
          const exportFileName = `${actualFileName}.${exportExtension}`

          return new NextResponse(uint8Array, {
            status: 200,
            headers: {
              'Content-Type': 'application/octet-stream',
              'Content-Disposition': `attachment; filename="${exportFileName}"`,
              'Content-Length': uint8Array.length.toString(),
              'Accept-Ranges': 'bytes',
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

        // Stream file directly to browser with octet-stream content type
        const headers: Record<string, string> = {
          'Content-Type': 'application/octet-stream',
          'Content-Disposition': `attachment; filename="${actualFileName}"`,
          'Accept-Ranges': 'bytes',
        }

        // Add Content-Length if file size is known
        if (fileSize) {
          headers['Content-Length'] = fileSize.toString()
        }

        return new NextResponse(webStream, {
          status: 200,
          headers,
        })
      } catch (error: any) {
        console.error('Direct download failed:', error)
        return NextResponse.json({ error: 'Download failed' }, { status: 500 })
      }
    }

    return NextResponse.json({ error: 'Invalid mode' }, { status: 400 })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Initialize Drive service with authentication
    const authResult = await initDriveService()
    if (!authResult.success) {
      return authResult.response!
    }

    const { driveService } = authResult

    // Get fileId from body and determine operation type
    const { fileId, items, downloadMode = 'oneByOne' } = body
    const isBulkOperation = items && items.length > 1

    if (isBulkOperation) {
      // Bulk operations handling
      if (!validateOperationsRequest(body)) {
        return NextResponse.json({ error: 'Invalid request body for bulk download' }, { status: 400 })
      }

      return await processBulkDownload(driveService, items, downloadMode)
    }

    // Single file download handling
    if (!fileId) {
      return NextResponse.json({ error: 'fileId is required for single file download' }, { status: 400 })
    }

    return await processSingleDownload(driveService, fileId, downloadMode)
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * Process bulk download operations with chunked processing for efficiency
 */
async function processBulkDownload(driveService: any, items: any[], downloadMode: string) {
  // Filter only files (skip folders automatically)
  const downloadableFiles = items.filter((item: any) => !item.isFolder)
  const skippedFolders = items.filter((item: any) => item.isFolder)

  const results = {
    success: [] as Array<{ id: string; name: string; downloadUrl?: string }>,
    skipped: skippedFolders.map((folder: any) => ({
      id: folder.id,
      name: folder.name,
      reason: 'Folders not supported',
    })),
    failed: [] as Array<{ id: string; name: string; error: string }>,
    downloadMode,
    timestamp: new Date().toISOString(),
  }

  // Chunked processing for better performance and rate limit handling
  const CHUNK_SIZE = 5
  const chunks = chunkArray(downloadableFiles, CHUNK_SIZE)

  for (const chunk of chunks) {
    const chunkPromises = chunk.map(async (file: any) => {
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
        const errorMessage = getErrorMessage(error)

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
    })

    // Process chunk in parallel
    await Promise.all(chunkPromises)
  }

  // For exportLinks mode, generate and return CSV file
  if (downloadMode === 'exportLinks') {
    if (results.success.length > 0) {
      const csvContent = generateDownloadCSV(results.success)
      const fileName = `download-links-${new Date().toISOString().split('T')[0]}.csv`

      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${fileName}"`,
        },
      })
    } else {
      return NextResponse.json({ error: 'No files available for CSV export' }, { status: 400 })
    }
  }

  // For other modes, return JSON response with download URLs
  return NextResponse.json(results)
}

/**
 * Process single file download with streaming or URL fallback
 */
async function processSingleDownload(driveService: any, fileId: string, downloadMode: string) {
  if (downloadMode === 'exportLinks') {
    // Return Google Drive direct download URL for CSV generation
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
    const fileSize = metadata.size ? parseInt(metadata.size) : undefined

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
          'Accept-Ranges': 'bytes',
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
    const headers: Record<string, string> = {
      'Content-Type': mimeType,
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Accept-Ranges': 'bytes',
    }

    // Add Content-Length if file size is known
    if (fileSize) {
      headers['Content-Length'] = fileSize.toString()
    }

    return new NextResponse(webStream, {
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
}

/**
 * Process individual file download - optimized for bulk operations
 */
async function processFileDownload(driveService: any, file: any, downloadMode: string) {
  try {
    // For batch mode, directly return Google Drive URL without additional API calls
    if (downloadMode === 'batch' || downloadMode === 'exportLinks') {
      const downloadUrl = `https://drive.google.com/uc?export=download&id=${file.id}`
      return {
        success: true,
        downloadUrl,
        fileName: file.name,
      }
    }

    // For other modes, get metadata if needed
    const fileMetadata = await throttledDriveRequest(async () => {
      return await retryDriveApiCall(async () => {
        return await driveService.files.get({
          fileId: file.id,
          fields: 'id,name,mimeType,size,webViewLink',
        })
      })
    })

    const fileData = fileMetadata.data
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

/**
 * Utility function to chunk array for batch processing
 */
function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize))
  }
  return chunks
}

/**
 * Generate CSV content for download links
 */
function generateDownloadCSV(successfulDownloads: Array<{ id: string; name: string; downloadUrl?: string }>) {
  const headers = 'File Name,Download Link\n'
  const rows = successfulDownloads
    .filter((item) => item.downloadUrl)
    .map((item) => `"${item.name}","${item.downloadUrl}"`)
    .join('\n')

  return headers + rows
}

/**
 * Check if file is Google Workspace file that needs export
 */
function isGoogleWorkspaceFile(mimeType: string): boolean {
  return mimeType?.startsWith('application/vnd.google-apps.') || false
}

/**
 * Get appropriate export format for Google Workspace files
 */
function getExportFormat(mimeType: string): string {
  const exportMap: { [key: string]: string } = {
    'application/vnd.google-apps.document': 'application/pdf',
    'application/vnd.google-apps.spreadsheet': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.google-apps.presentation': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.google-apps.drawing': 'image/png',
  }

  return exportMap[mimeType] || 'application/pdf'
}

/**
 * Get file extension from mime type
 */
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

/**
 * Extract user-friendly error message
 */
function getErrorMessage(error: any): string {
  if (error?.response?.data?.error) {
    const apiError = error.response.data.error

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

/**
 * Check if error should cause file to be skipped rather than failed
 */
function isSkippableError(error: any): boolean {
  const errorCode = error?.response?.data?.error?.code
  const errorMessage = error?.response?.data?.error?.message || ''

  return (errorCode === 403 && (errorMessage.includes('rateLimitExceeded') || errorMessage.includes('quotaExceeded') || errorMessage.includes('storageQuotaExceeded'))) || errorCode === 429
}
