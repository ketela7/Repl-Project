import { NextRequest, NextResponse } from 'next/server'

import { initDriveService, handleApiError } from '@/lib/api-utils'
import { retryDriveApiCall } from '@/lib/api-retry'
import { throttledDriveRequest } from '@/lib/api-throttle'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const fileId = searchParams.get('fileId')
    const format = searchParams.get('format') || 'pdf'

    if (!fileId) {
      return NextResponse.json({ error: 'File ID is required' }, { status: 400 })
    }

    // Initialize Drive service with authentication
    const authResult = await initDriveService()
    if (!authResult.success) {
      return authResult.response!
    }

    const driveService = authResult.driveService!

    // Get file metadata first
    const metadata = await throttledDriveRequest(async () => {
      return await retryDriveApiCall(async () => {
        return await driveService.drive.files.get({
          fileId,
          fields: 'name,mimeType',
        })
      })
    })

    const { name: fileName, mimeType } = metadata.data

    if (!fileName || !mimeType) {
      return NextResponse.json({ error: 'File metadata incomplete' }, { status: 500 })
    }

    // Check if it's a Google Workspace file that can be exported
    if (!isGoogleWorkspaceFile(mimeType)) {
      return NextResponse.json(
        { error: 'File is not a Google Workspace document' },
        { status: 400 },
      )
    }

    // Get export MIME type
    const exportMimeType = getExportMimeType(format, mimeType)

    // Export the file
    const response = await throttledDriveRequest(async () => {
      return await retryDriveApiCall(async () => {
        return await driveService.drive.files.export(
          {
            fileId,
            mimeType: exportMimeType,
          },
          {
            responseType: 'stream',
          },
        )
      })
    })

    // Get file extension
    const fileExtension = getFileExtension(format)
    const exportFileName = `${fileName.replace(/\.[^/.]+$/, '')}.${fileExtension}`

    // Convert Node.js stream to Web Stream
    const stream = new ReadableStream({
      start(controller) {
        let closed = false

        response.data.on('data', (chunk: Buffer) => {
          if (!closed) {
            controller.enqueue(new Uint8Array(chunk))
          }
        })

        response.data.on('end', () => {
          if (!closed) {
            closed = true
            controller.close()
          }
        })

        response.data.on('error', (err: Error) => {
          if (!closed) {
            closed = true
            controller.error(err)
          }
        })
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': exportMimeType,
        'Content-Disposition': `attachment; filename="${exportFileName}"`,
        'Cache-Control': 'no-cache',
      },
    })
  } catch (error) {
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
      'application/vnd.google-apps.document':
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    },
    xlsx: {
      'application/vnd.google-apps.spreadsheet':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
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
    odt: {
      'application/vnd.google-apps.document': 'application/vnd.oasis.opendocument.text',
    },
    ods: {
      'application/vnd.google-apps.spreadsheet': 'application/vnd.oasis.opendocument.spreadsheet',
    },
    odp: {
      'application/vnd.google-apps.presentation': 'application/vnd.oasis.opendocument.presentation',
    },
    rtf: {
      'application/vnd.google-apps.document': 'application/rtf',
    },
    html: {
      'application/vnd.google-apps.document': 'text/html',
    },
    csv: {
      'application/vnd.google-apps.spreadsheet': 'text/csv',
    },
    jpeg: {
      'application/vnd.google-apps.drawing': 'image/jpeg',
    },
  }

  return formatMap[format]?.[originalMimeType] || 'application/pdf'
}

/**
 * Get file extension from format
 */
function getFileExtension(format: string): string {
  const extensionMap: { [key: string]: string } = {
    pdf: 'pdf',
    docx: 'docx',
    xlsx: 'xlsx',
    pptx: 'pptx',
    png: 'png',
    txt: 'txt',
    odt: 'odt',
    ods: 'ods',
    odp: 'odp',
    rtf: 'rtf',
    html: 'html',
    csv: 'csv',
    jpeg: 'jpg',
  }

  return extensionMap[format] || 'pdf'
}
