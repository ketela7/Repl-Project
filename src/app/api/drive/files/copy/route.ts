import { NextRequest, NextResponse } from 'next/server'

import { initDriveService, handleApiError } from '@/lib/api-utils'

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

    // Debug: Log received request data
    const requestInfo = {
      fileId,
      targetFolderId,
      namePrefix,
      itemsCount: items?.length || 0,
      timestamp: new Date().toISOString(),
    }
    
    console.log('🔄 Copy API Request:', requestInfo)

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
        console.log(`🔄 Copying file ${id} to folder ${targetFolderId}`)
        const result = await driveService.copyFile(id, targetFolderId)
        console.log(`✅ Successfully copied file ${id}`)
        results.push({ fileId: id, success: true, result })
      } catch (error: any) {
        console.error(`❌ Failed to copy file ${id}:`, error)
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
