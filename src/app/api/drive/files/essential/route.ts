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

    // Get essential file metadata for quick loading
    const essentialFields = ['id', 'name', 'mimeType', 'size', 'createdTime', 'modifiedTime', 'parents', 'trashed', 'capabilities']

    const fileMetadata = await driveService.getFileMetadata(fileId, essentialFields)

    return NextResponse.json({
      success: true,
      fileMetadata,
      operation: 'essential',
    })
  } catch (error: any) {
    return handleApiError(error)
  }
}
