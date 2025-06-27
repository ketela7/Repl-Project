import { NextRequest, NextResponse } from 'next/server'

import { initDriveService, handleApiError, validateOperationsRequest } from '@/lib/api-utils'
import { retryDriveApiCall } from '@/lib/api-retry'
import { throttledDriveRequest } from '@/lib/api-throttle'

export async function POST(request: NextRequest, { params }: { params: { fileId: string } }) {
  try {
    const { fileId } = params
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
          reason: 'Folder cannot be downloaded',
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

    // Handle single file download
    const downloadResult = await processFileDownload(driveService, { id: fileId }, body.downloadMode || 'oneByOne')

    if (downloadResult.success) {
      return NextResponse.json({
        success: true,
        downloadUrl: downloadResult.downloadUrl,
        fileName: downloadResult.fileName,
      })
    } else {
      return NextResponse.json({ error: downloadResult.error }, { status: 400 })
    }
  } catch (error) {
    return handleApiError(error)
  }
}

// Process individual file download
async function processFileDownload(driveService: any, file: any, downloadMode: string) {
  try {
    // Get file metadata first
    const fileMetadata = await throttledDriveRequest(async () => {
      return await retryDriveApiCall(async () => {
        return await driveService.files.get({
          fileId: file.id,
          fields: 'id,name,mimeType,size,webContentLink',
        })
      })
    })

    const fileData = fileMetadata.data

    // Check if file is downloadable
    if (!fileData.webContentLink && !isGoogleWorkspaceFile(fileData.mimeType)) {
      throw new Error('File is not downloadable')
    }

    let downloadUrl: string

    if (isGoogleWorkspaceFile(fileData.mimeType)) {
      // For Google Workspace files, use export endpoint
      const exportFormat = getExportFormat(fileData.mimeType)
      downloadUrl = `https://www.googleapis.com/drive/v3/files/${file.id}/export?mimeType=${exportFormat}`
    } else {
      // For regular files, use direct download
      downloadUrl = `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`
    }

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
