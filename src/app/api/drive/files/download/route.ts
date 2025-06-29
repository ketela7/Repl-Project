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

    const { items, downloadMode } = body
    if (!validateDownloadRequest(body)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    return await processDownload(driveService, items, downloadMode)
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * Process download with streaming or URL fallback
 */
async function processDownload(driveService: any, items: any[], downloadMode: string) {
  const headers = 'File Name,Download Link\n'
  for (const item of items) {
    if (downloadMode === 'exportLinks') {
      const rows = `${item.name},https://drive.google.com/uc?export=download&id=${item.id}\n`

      // T0D0: save (headers+rows)to download-date.now().csv
      return
    }

    try {
      // Get file metadata first for proper filename
      const metadata = await throttledDriveRequest(async () => {
        return await retryDriveApiCall(async () => {
          return await driveService.getFileMetadata(fileId, ['name', 'mimeType', 'size'])
        })
      })

      const fileName = metadata.name
      const mimeType = metadata.mimeType || 'application/octet-stream'
      const fileSize = metadata.size ? parseInt(metadata.size) : null

      const response = await drive.files.get(
        {
          fileId,
          alt: 'media',
        },
        { responseType: 'stream' }
      )

      downloadResult = {
        data: response.data,
        filename: fileMetadata.data.name || 'download',
        mimeType: fileMetadata.data.mimeType || 'application/octet-stream',
        size: fileMetadata.data.size || null,
      }
      if (!downloadResult) {
        return res.status(500).json({ error: 'Failed to download file' })
      }

      // Set appropriate headers
      res.setHeader('Content-Type', downloadResult.mimeType || 'application/octet-stream')
      res.setHeader('Content-Disposition', `attachment; filename="${downloadResult.filename}"`)

      if (downloadResult.size) {
        res.setHeader('Content-Length', downloadResult.size)
      }

      // Send the file data
      return res.status(200).send(downloadResult.data)
    } catch (error: any) {
      // Fallback to Google Drive direct URL if streaming fails
      const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`
      return NextResponse.json({
        success: true,
        downloadUrl,
        fileName,
        fallback: true,
      })
    }
  }
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
