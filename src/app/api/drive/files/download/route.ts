
import { NextRequest, NextResponse } from 'next/server'

import { initDriveService, handleApiError, validateDownloadRequest } from '@/lib/api-utils'
import { retryDriveApiCall } from '@/lib/api-retry'
import { throttledDriveRequest } from '@/lib/api-throttle'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Initialize Drive service with authentication
    const authResult = await initDriveService()
    if (!authResult.success) {
      return authResult.response!
    }

    const { driveService } = authResult

    let { items, downloadMode } = body
    if (!validateDownloadRequest(body)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    // Normalize single item to array for unified processing
    if (!Array.isArray(items)) {
      items = [items]
    }

    return await processParallelDownload(driveService, items, downloadMode)
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * Process downloads with parallel streaming and progress tracking
 */
async function processParallelDownload(driveService: any, items: any[], downloadMode: string) {
  // Handle export links mode
  if (downloadMode === 'exportLinks') {
    const csvContent = generateDownloadCSV(items.map(item => ({
      id: item.id,
      name: item.name,
      downloadUrl: `https://drive.google.com/uc?export=download&id=${item.id}`
    })))
    
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="download-links-${Date.now()}.csv"`
      }
    })
  }

  // Parallel processing for streaming downloads
  const results = await Promise.allSettled(
    items.map(async (item, index) => {
      try {
        return await processItemDownload(driveService, item, index)
      } catch (error) {
        return {
          success: false,
          id: item.id,
          name: item.name,
          error: getErrorMessage(error),
          skipped: isSkippableError(error)
        }
      }
    })
  )

  // Process results
  const successful = []
  const failed = []
  const skipped = []

  results.forEach((result, index) => {
    const item = items[index]
    
    if (result.status === 'fulfilled') {
      const data = result.value
      if (data.success) {
        successful.push(data)
      } else if (data.skipped) {
        skipped.push({
          id: item.id,
          name: item.name,
          reason: data.error
        })
      } else {
        failed.push({
          id: item.id,
          name: item.name,
          error: data.error
        })
      }
    } else {
      failed.push({
        id: item.id,
        name: item.name,
        error: getErrorMessage(result.reason)
      })
    }
  })

  // For single file success, return stream directly
  if (items.length === 1 && successful.length === 1) {
    const result = successful[0]
    return new NextResponse(result.stream, {
      headers: {
        'Content-Type': result.mimeType,
        'Content-Disposition': `attachment; filename="${result.fileName}"`,
        ...(result.size && { 'Content-Length': result.size.toString() })
      }
    })
  }

  // For batch or failed single downloads, return summary with URLs
  return NextResponse.json({
    success: successful.map(item => ({
      id: item.id,
      name: item.fileName,
      downloadUrl: item.fallbackUrl || `https://drive.google.com/uc?export=download&id=${item.id}`,
      direct: !item.fallbackUrl
    })),
    failed,
    skipped,
    summary: {
      total: items.length,
      successful: successful.length,
      failed: failed.length,
      skipped: skipped.length
    }
  })
}

/**
 * Process individual item download with stream handling
 */
async function processItemDownload(driveService: any, item: any, index: number) {
  const fileId = item.id

  try {
    // Get file metadata
    const metadata = await throttledDriveRequest(async () => {
      return await retryDriveApiCall(async () => {
        return await driveService.files.get({
          fileId,
          fields: 'name,mimeType,size,parents'
        })
      })
    })

    const fileName = metadata.data.name
    const mimeType = metadata.data.mimeType
    const fileSize = metadata.data.size

    // Handle Google Workspace files
    if (isGoogleWorkspaceFile(mimeType)) {
      const exportFormat = getExportFormat(mimeType)
      const exportResponse = await throttledDriveRequest(async () => {
        return await retryDriveApiCall(async () => {
          return await driveService.files.export({
            fileId,
            mimeType: exportFormat
          }, { responseType: 'stream' })
        })
      })

      const exportFileName = `${fileName.replace(/\.[^/.]+$/, "")}.${getFileExtension(exportFormat)}`
      
      return {
        success: true,
        id: fileId,
        fileName: exportFileName,
        mimeType: exportFormat,
        stream: exportResponse.data,
        size: null,
        index
      }
    }

    // Regular file download
    const downloadResponse = await throttledDriveRequest(async () => {
      return await retryDriveApiCall(async () => {
        return await driveService.files.get({
          fileId,
          alt: 'media'
        }, { responseType: 'stream' })
      })
    })

    return {
      success: true,
      id: fileId,
      fileName,
      mimeType: mimeType || 'application/octet-stream',
      stream: downloadResponse.data,
      size: fileSize ? parseInt(fileSize) : null,
      index
    }

  } catch (error: any) {
    // Fallback to direct URL on stream failure
    const fallbackUrl = `https://drive.google.com/uc?export=download&id=${fileId}`
    
    return {
      success: true,
      id: fileId,
      fileName: item.name || 'download',
      fallbackUrl,
      error: getErrorMessage(error),
      index
    }
  }
}

/**
 * Generate CSV content for download links
 */
function generateDownloadCSV(items: Array<{ id: string; name: string; downloadUrl?: string }>) {
  const headers = 'File Name,Download Link\n'
  const rows = items
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
