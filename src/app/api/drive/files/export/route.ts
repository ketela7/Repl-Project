import { NextRequest, NextResponse } from 'next/server'

import { initDriveService, handleApiError } from '@/lib/api-utils'

export async function POST(request: NextRequest) {
  try {
    const authResult = await initDriveService()
    if (!authResult.success) {
      return authResult.response!
    }

    const driveService = authResult.driveService!
    const body = await request.json()

    // Handle both single and bulk operations
    const { fileId, items, exportFormat = 'pdf' } = body

    // Determine operation type based on items array or single fileId
    const fileIds = items && items.length > 0 ? items.map((item: any) => item.id) : [fileId]
    const isBulkOperation = items && items.length > 1

    if (!fileIds || fileIds.length === 0) {
      return NextResponse.json({ error: 'File IDs are required' }, { status: 400 })
    }

    const results = []
    const errors = []

    for (const id of fileIds) {
      try {
        // Get file metadata to determine if export is needed
        const metadata = await driveService.getFileMetadata(id, ['name', 'mimeType'])
        const mimeType = metadata.mimeType

        // Check if it's a Google Workspace file that can be exported
        if (isGoogleWorkspaceFile(mimeType)) {
          const exportMimeType = getExportMimeType(exportFormat, mimeType)
          await driveService.exportFile(id, exportMimeType)

          results.push({
            fileId: id,
            success: true,
            exported: true,
            originalMimeType: mimeType,
            exportMimeType,
            exportFormat,
            fileName: metadata.name,
          })
        } else {
          // Regular file - provide download URL
          const downloadUrl = `https://drive.google.com/uc?export=download&id=${id}`
          results.push({
            fileId: id,
            success: true,
            exported: false,
            downloadUrl,
            fileName: metadata.name,
            note: 'File is already in downloadable format',
          })
        }
      } catch (error: any) {
        errors.push({
          fileId: id,
          success: false,
          error: error.message || 'Export operation failed',
        })
      }
    }

    const response = {
      success: errors.length === 0,
      processed: results.length,
      failed: errors.length,
      type: isBulkOperation ? 'bulk' : 'single',
      operation: 'export',
      exportFormat,
      results,
      errors: errors.length > 0 ? errors : undefined,
    }

    return NextResponse.json(response, {
      status: errors.length === 0 ? 200 : 207,
    })
  } catch (error: any) {
    return handleApiError(error)
  }
}

/**
 * Check if file is Google Workspace file that can be exported
 */
function isGoogleWorkspaceFile(mimeType: string): boolean {
  return mimeType?.startsWith('application/vnd.google-apps.') || false
}

/**
 * Get export MIME type based on format and original MIME type
 */
function getExportMimeType(format: string, originalMimeType: string): string {
  const formatMap: { [key: string]: { [key: string]: string } } = {
    pdf: {
      'application/vnd.google-apps.document': 'application/pdf',
      'application/vnd.google-apps.spreadsheet': 'application/pdf',
      'application/vnd.google-apps.presentation': 'application/pdf',
      'application/vnd.google-apps.drawing': 'application/pdf',
    },
    docx: {
      'application/vnd.google-apps.document': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    },
    xlsx: {
      'application/vnd.google-apps.spreadsheet': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    },
    pptx: {
      'application/vnd.google-apps.presentation':
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    },
    png: {
      'application/vnd.google-apps.drawing': 'image/png',
    },
    txt: {
      'application/vnd.google-apps.document': 'text/plain',
    },
  }

  return formatMap[format]?.[originalMimeType] || 'application/pdf'
}
