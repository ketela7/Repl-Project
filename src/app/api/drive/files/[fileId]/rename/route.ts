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
    const { namePrefix, newName } = body

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
        let finalName = newName

        // For bulk operations, use prefix with original name
        if (fileIds.length > 1 && namePrefix) {
          const fileDetails = await driveService.getFile(id)
          finalName = `${namePrefix} ${fileDetails.name}`
        }

        if (!finalName) {
          errors.push({
            fileId: id,
            success: false,
            error: 'New name is required',
          })
          continue
        }

        const result = await driveService.renameFile(id, finalName)
        results.push({ fileId: id, success: true, result })
      } catch (error: any) {
        errors.push({
          fileId: id,
          success: false,
          error: error.message || 'Rename failed',
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
      { error: 'Failed to rename files' },
      { status: 500 }
    )
  }
}
