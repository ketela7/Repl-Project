import { NextRequest, NextResponse } from 'next/server'

import { initDriveService, handleApiError } from '@/lib/api-utils'
import { retryDriveApiCall } from '@/lib/api-retry'
import { throttledDriveRequest } from '@/lib/api-throttle'

export async function POST(request: NextRequest) {
  try {
    const authResult = await initDriveService()
    if (!authResult.success) {
      return authResult.response!
    }

    const { driveService } = authResult
    const body = await request.json()
    const { folderId } = body

    if (!folderId) {
      return NextResponse.json({ error: 'Folder ID is required' }, { status: 400 })
    }

    try {
      // Use minimal fields to reduce API load and improve error handling
      const response = await throttledDriveRequest(async () => {
        return await retryDriveApiCall(async () => {
          return await driveService.drive.files.get({
            fileId: folderId,
            fields: 'id,name,mimeType,trashed,capabilities(canAddChildren)',
          })
        })
      })

      const file = response.data

      // Check if it's actually a folder
      if (file.mimeType !== 'application/vnd.google-apps.folder') {
        return NextResponse.json({
          success: false,
          error: 'The provided ID is not a folder',
          details: 'The ID points to a file, not a folder',
        })
      }

      // Check if folder is trashed
      if (file.trashed) {
        return NextResponse.json({
          success: false,
          error: 'Folder is in trash',
          details: 'Cannot move items to a trashed folder',
        })
      }

      // Check if user can add children (write permission)
      const canAddChildren = file.capabilities?.canAddChildren ?? false
      if (!canAddChildren) {
        return NextResponse.json({
          success: false,
          error: 'Access denied',
          details: 'You do not have permission to add files to this folder',
        })
      }

      return NextResponse.json({
        success: true,
        folder: {
          id: file.id,
          name: file.name,
          mimeType: file.mimeType,
          canAddChildren,
        },
      })
    } catch (error: any) {
      // Handle specific Google Drive API errors
      if (error.code === 404) {
        return NextResponse.json({
          success: false,
          error: 'Folder not found',
          details: 'The folder ID does not exist or you do not have access to it',
        })
      }

      if (error.code === 403) {
        return NextResponse.json({
          success: false,
          error: 'Access denied',
          details: 'You do not have permission to access this folder',
        })
      }

      if (error.code === 401) {
        return NextResponse.json({
          success: false,
          error: 'Authentication required',
          details: 'Please reconnect your Google Drive account',
        })
      }

      // Generic error for other cases
      return NextResponse.json({
        success: false,
        error: 'Folder validation failed',
        details: error.message || 'Unable to validate folder access',
      })
    }
  } catch (error) {
    return handleApiError(error)
  }
}
