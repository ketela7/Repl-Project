import { NextRequest, NextResponse } from 'next/server'

import { initDriveService, handleApiError, validateOperationsRequest } from '@/lib/api-utils'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Initialize Drive service with authentication
    const authResult = await initDriveService()
    if (!authResult.success) {
      return authResult.response!
    }

    const { driveService } = authResult

    // Validate request body
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
        reason: 'Folders not supported',
      })),
      failed: [] as Array<{ id: string; name: string; error: string }>,
      downloadMode,
      timestamp: new Date().toISOString(),
    }

    // Process each file to generate download URLs
    for (const file of downloadableFiles) {
      try {
        // Generate direct Google Drive download URL
        const downloadUrl = `https://drive.google.com/uc?export=download&id=${file.id}`

        results.success.push({
          id: file.id,
          name: file.name,
          downloadUrl,
        })
      } catch (error: any) {
        results.failed.push({
          id: file.id,
          name: file.name,
          error: getErrorMessage(error),
        })
      }
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

    // For other modes, return JSON response
    return NextResponse.json(results)
  } catch (error) {
    return handleApiError(error)
  }
}

// Generate CSV content for download links
function generateDownloadCSV(successfulDownloads: Array<{ id: string; name: string; downloadUrl?: string }>) {
  const headers = 'File Name,Download Link\n'
  const rows = successfulDownloads
    .filter((item) => item.downloadUrl)
    .map((item) => `"${item.name}","${item.downloadUrl}"`)
    .join('\n')

  return headers + rows
}

// Extract user-friendly error message
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
