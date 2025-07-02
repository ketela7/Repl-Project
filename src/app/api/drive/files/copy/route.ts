import { NextRequest, NextResponse } from 'next/server'

import { initDriveService, handleApiError } from '@/lib/apiutils'

export async function POST(request: NextRequest) {
  try {
    const authResult = await initDriveService()
    if (!authResult.success) {
      return authResult.response!
    }

    const driveService = authResult.driveService!
    const body = await request.json()

    // Handle both single and bulk operations
    const { fileId, targetFolderId, namePrefix, items } = body

    // Determine operation type based on items array or single fileId
    const fileIds = items && items.length > 0 ? items.map((item: any) => item.id) : [fileId]
    const isBulkOperation = items && items.length > 1

    if (!fileIds || fileIds.length === 0) {
      return NextResponse.json({ error: 'File IDs are required' }, { status: 400 })
    }

    const results = []
    const errors = []

    for (const id of fileIds) {
      try {
        const result = await driveService.copyFile(id, targetFolderId)
        results.push({ fileId: id, success: true, result })
      } catch (error: any) {
        errors.push({
          fileId: id,
          success: false,
          error: error.message || 'Copy failed',
        })
      }
    }

    const response = {
      success: errors.length === 0,
      processed: results.length,
      failed: errors.length,
      type: isBulkOperation ? 'bulk' : 'single',
      operation: 'copy',
      targetFolderId,
      namePrefix,
      results,
      errors: errors.length > 0 ? errors : undefined,
    }

    return NextResponse.json(response, {
      status: errors.length === 0 ? 200 : 207,
    })
  } catch (error: any) {
    return handleApiError(error)
  }
}
