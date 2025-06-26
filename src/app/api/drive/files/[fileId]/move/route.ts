import { NextRequest, NextResponse } from 'next/server'

import { initDriveService } from '@/lib/api-utils'

export async function POST(
  request: NextRequest,
  { params }: { params: { fileId: string } }
) {
  try {
    const authResult = await initDriveService()
    if (!authResult.success) {
      return authResult.response!
    }

    const { driveService } = authResult
    const fileId = params.fileId
    const body = await request.json()

    // Handle both single and bulk operations
    const fileIds = fileId === 'bulk' ? body.fileIds : [fileId]
    const { targetFolderId } = body

    if (!targetFolderId) {
      return NextResponse.json(
        { error: 'Target folder ID is required' },
        { status: 400 }
      )
    }

    if (!fileIds || fileIds.length === 0) {
      return NextResponse.json(
        { error: 'File IDs are required' },
        { status: 400 }
      )
    }

    const results = []
    const errors = []

    for (const id of fileIds) {
      try {
        const result = await driveService.moveFile(id, targetFolderId)
        results.push({ fileId: id, success: true, result })
      } catch (error: any) {
        errors.push({
          fileId: id,
          success: false,
          error: error.message || 'Move failed',
        })
      }
    }

    const response = {
      success: errors.length === 0,
      processed: results.length,
      failed: errors.length,
      results,
      errors: errors.length > 0 ? errors : undefined,
    }

    return NextResponse.json(response, {
      status: errors.length === 0 ? 200 : 207, // 207 Multi-Status for partial success
    })
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to move files' }, { status: 500 })
  }
}
