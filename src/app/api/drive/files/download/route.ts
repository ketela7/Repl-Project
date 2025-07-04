import { NextRequest, NextResponse } from 'next/server'

import { initDriveService, handleApiError } from '@/lib/api-utils'
import { retryDriveApiCall } from '@/lib/api-retry'
import { throttledDriveRequest } from '@/lib/api-throttle'
// Config import removed as unused

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
            try {
              controller.enqueue(new Uint8Array(chunk))
            } catch (err) {
              // Controller might already be closed
              if (!closed) {
                closed = true
              }
            }
          }
        })

        response.data.on('end', () => {
          if (!closed) {
            closed = true
            try {
              controller.close()
            } catch (err) {
              // Controller might already be closed
              console.log('Controller already closed on end')
            }
          }
        })

        response.data.on('error', (err: Error) => {
          if (!closed) {
            closed = true
            try {
              controller.error(err)
            } catch (closeErr) {
              // Controller might already be closed
              console.log('Controller already closed on error')
            }
          }
        })
      },
      cancel() {
        // Clean up when stream is cancelled
        if (response.data && typeof response.data.destroy === 'function') {
          response.data.destroy()
        }
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
    'application/vnd.google-apps.spreadsheet':
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.google-apps.presentation':
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
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
 * Handle bulk download requests
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await initDriveService()
    if (!authResult.success) {
      return authResult.response!
    }

    const { driveService } = authResult
    const body = await request.json()
    const { fileIds, exportLinks } = body

    if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
      return NextResponse.json({ error: 'File IDs are required' }, { status: 400 })
    }

    // If requesting export links, return CSV data
    if (exportLinks) {
      const links = []
      const errors = []

      for (const fileId of fileIds) {
        try {
          const metadata = await throttledDriveRequest(async () => {
            return await retryDriveApiCall(async () => {
              return await driveService!.drive.files.get({
                fileId,
                fields: 'name,mimeType,webViewLink',
              })
            })
          })

          const { name, mimeType, webViewLink } = metadata.data
          const downloadUrl = webViewLink || `https://drive.google.com/file/d/${fileId}/view`

          links.push({
            id: fileId,
            name: name || 'Unknown',
            url: downloadUrl,
            mimeType: mimeType || 'application/octet-stream',
          })
        } catch (error: any) {
          errors.push({
            fileId,
            error: error.message || 'Failed to get file metadata',
          })
        }
      }

      return NextResponse.json({
        success: errors.length === 0,
        links,
        errors: errors.length > 0 ? errors : undefined,
      })
    }

    // For single file download, return download URL
    if (fileIds.length === 1) {
      const fileId = fileIds[0]

      try {
        const metadata = await throttledDriveRequest(async () => {
          return await retryDriveApiCall(async () => {
            return await driveService!.drive.files.get({
              fileId,
              fields: 'name,mimeType,webViewLink',
            })
          })
        })

        const { name, mimeType } = metadata.data

        // Get proper origin URL - use correct domain
        const origin = request.headers.get('host')
          ? `${request.nextUrl.protocol}//${request.headers.get('host')}`
          : request.nextUrl.origin

        // For Google Workspace files, create export URL
        if (isGoogleWorkspaceFile(mimeType)) {
          const exportFormat = getExportFormat(mimeType)
          const exportUrl = `${origin}/api/drive/files/download?fileId=${fileId}`

          return NextResponse.json({
            success: true,
            downloadUrl: exportUrl,
            fileName: name,
            mimeType: exportFormat,
          })
        }

        // For regular files, create download URL
        const downloadUrl = `${origin}/api/drive/files/download?fileId=${fileId}`

        return NextResponse.json({
          success: true,
          downloadUrl,
          fileName: name,
          mimeType,
        })
      } catch (error: any) {
        return NextResponse.json(
          { error: error.message || 'Failed to get file metadata' },
          { status: 500 },
        )
      }
    }

    // For multiple files, return error as we don't support bulk download streams
    return NextResponse.json(
      { error: 'Multiple file downloads not supported. Use exportLinks mode.' },
      { status: 400 },
    )
  } catch (error) {
    return handleApiError(error)
  }
}
