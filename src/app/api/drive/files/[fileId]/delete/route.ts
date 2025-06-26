import { NextRequest, NextResponse } from 'next/server'

import { initDriveService } from '@/lib/api-utils'

export async function DELETE(
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

    // For bulk operations, get fileIds from request body
    let fileIds = [fileId]

    if (fileId === 'bulk') {
      const body = await request.json()
      fileIds = body.fileIds || []
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
        await driveService.deleteFile(id)
        results.push({ fileId: id, success: true, result: { deleted: true } })
      } catch (error: any) {
        errors.push({
          fileId: id,
          success: false,
          error: error.message || 'Delete failed',
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
      status: errors.length === 0 ? 200 : 207,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to delete files' },
      { status: 500 }
    )
  }
}
