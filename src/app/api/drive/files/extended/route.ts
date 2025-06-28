import { NextRequest, NextResponse } from 'next/server'

import { initDriveService, handleApiError } from '@/lib/api-utils'

export async function POST(request: NextRequest) {
  try {
    const authResult = await initDriveService()
    if (!authResult.success) {
      return authResult.response!
    }

    const { driveService } = authResult
    const body = await request.json()

    // Get fileId from body
    const { fileId } = body

    if (!fileId) {
      return NextResponse.json({ error: 'File ID is required' }, { status: 400 })
    }

    // Get extended file metadata for detailed view
    const extendedFields = [
      'permissions',
      'owners',
      'lastModifyingUser',
      'sharingUser',
      'viewedByMe',
      'viewedByMeTime',
      'version',
      'webViewLink',
      'webContentLink',
      'iconLink',
      'thumbnailLink',
      'hasThumbnail',
      'imageMediaMetadata',
      'videoMediaMetadata',
      'contentHints',
      'properties',
      'appProperties',
    ]

    const fileMetadata = await driveService.getFileMetadata(fileId, extendedFields)

    return NextResponse.json({
      success: true,
      fileMetadata,
      operation: 'extended',
    })
  } catch (error: any) {
    return handleApiError(error)
  }
}
