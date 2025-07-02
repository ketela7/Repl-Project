import { NextRequest, NextResponse } from 'next/server'

import { initDriveService, handleApiError } from '@/lib/apiutils'
import { retryDriveApiCall } from '@/lib/apiretry'
import { throttledDriveRequest } from '@/lib/apithrottle'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const fileId = searchParams.get('fileId')

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
          fields: 'name,mimeType,size',
        })
      })
    })

    const { name: fileName, mimeType, size } = metadata.data

    if (!fileName || !mimeType) {
      return NextResponse.json({ error: 'File metadata incomplete' }, { status: 500 })
    }

    // Handle Google Workspace files (export)
    if (isGoogleWorkspaceFile(mimeType)) {
      const exportFormat = getExportFormat(mimeType)
      const response = await throttledDriveRequest(async () => {
        return await retryDriveApiCall(async () => {
          return await driveService.drive.files.export(
            {
              fileId,
              mimeType: exportFormat,
            },
            {
              responseType: 'stream',
            },
          )
        })
      })

      const exportFileName = `${fileName.replace(/\.[^/.]+$/, '')}.${getFileExtension(exportFormat)}`

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
          'Content-Type': exportFormat,
          'Content-Disposition': `attachment; filename="${exportFileName}"`,
          'Cache-Control': 'nocache',
        },
      })
    }

    // Regular file download - stream response
    const response = await throttledDriveRequest(async () => {
      return await retryDriveApiCall(async () => {
        return await driveService.drive.files.get(
          {
            fileId,
            alt: 'media',
          },
          {
            responseType: 'stream',
          },
        )
      })
    })

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
        'Content-Type': mimeType || 'application/octetstream',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        ...(size && { 'Content-Length': size }),
        'Cache-Control': 'nocache',
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * Check if file is Google Workspace file that needs export
 */
function isGoogleWorkspaceFile(mimeType: string): boolean {
  return mimeType?.startsWith('application/vnd.googleapps.') || false
}

/**
 * Get appropriate export format for Google Workspace files
 */
function getExportFormat(mimeType: string): string {
  const exportMap: { [key: string]: string } = {
    'application/vnd.googleapps.document': 'application/pdf',
    'application/vnd.googleapps.spreadsheet': 'application/vnd.openxmlformatsofficedocument.spreadsheetml.sheet',
    'application/vnd.googleapps.presentation':
      'application/vnd.openxmlformatsofficedocument.presentationml.presentation',
    'application/vnd.googleapps.drawing': 'image/png',
  }

  return exportMap[mimeType] || 'application/pdf'
}

/**
 * Get file extension from mime type
 */
function getFileExtension(mimeType: string): string {
  const extensionMap: { [key: string]: string } = {
    'application/pdf': 'pdf',
    'application/vnd.openxmlformatsofficedocument.spreadsheetml.sheet': 'xlsx',
    'application/vnd.openxmlformatsofficedocument.presentationml.presentation': 'pptx',
    'application/vnd.openxmlformatsofficedocument.wordprocessingml.document': 'docx',
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'text/plain': 'txt',
    'text/csv': 'csv',
  }

  return extensionMap[mimeType] || 'pdf'
}
