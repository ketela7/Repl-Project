import { NextRequest, NextResponse } from 'next/server'

import { initDriveService, handleApiError, validateDownloadRequest } from '@/lib/api-utils'
import { retryDriveApiCall } from '@/lib/api-retry'
import { throttledDriveRequest } from '@/lib/api-throttle'

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

    const { driveService } = authResult

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
            }
          )
        })
      })

      const exportFileName = `${fileName.replace(/\.[^/.]+$/, '')}.${getFileExtension(exportFormat)}`

      // Convert Node.js stream to Web Stream
      const stream = new ReadableStream({
        start(controller) {
          response.data.on('data', (chunk: Buffer) => {
            controller.enqueue(new Uint8Array(chunk))
          })
          response.data.on('end', () => {
            controller.close()
          })
          response.data.on('error', (err: Error) => {
            controller.error(err)
          })
        },
      })

      return new Response(stream, {
        headers: {
          'Content-Type': exportFormat,
          'Content-Disposition': `attachment; filename="${exportFileName}"`,
          'Cache-Control': 'no-cache',
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
          }
        )
      })
    })

    // Convert Node.js stream to Web Stream
    const stream = new ReadableStream({
      start(controller) {
        response.data.on('data', (chunk: Buffer) => {
          controller.enqueue(new Uint8Array(chunk))
        })
        response.data.on('end', () => {
          controller.close()
        })
        response.data.on('error', (err: Error) => {
          controller.error(err)
        })
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': mimeType || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        ...(size && { 'Content-Length': size }),
        'Cache-Control': 'no-cache',
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!validateDownloadRequest(body)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    let { items } = body

    // Normalize single item to array
    if (!Array.isArray(items)) {
      items = [items]
    }

    // Since we're using direct window.open() calls, just return success
    return NextResponse.json({
      success: true,
      message: 'Downloads initiated',
      count: items.length,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

// Helper functions for Google Workspace files

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
