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
    const { fileId, targetFolderId, items } = body

    // Debug: Log received request data
    const requestInfo = {
      fileId,
      targetFolderId,
      itemsCount: items?.length || 0,
      timestamp: new Date().toISOString(),
    }

    console.log('🔄 Move API Request:', requestInfo)

    if (!targetFolderId) {
      return NextResponse.json(
        {
          error: 'Target folder ID is required',
          debug: { received: requestInfo },
        },
        { status: 400 },
      )
    }

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
        console.log(`🔄 Moving file ${id} to folder ${targetFolderId}`)
        const result = await driveService.moveFile(id, targetFolderId)
        console.log(`✅ Successfully moved file ${id}`)
        results.push({ fileId: id, success: true, result })
      } catch (error: unknown) {
        console.error(`❌ Failed to move file ${id}:`, error)
        // Improved error handling with more detailed messages
        let errorMessage = 'Move failed'
        let errorCode = 'UNKNOWN_ERROR'

        if (error instanceof Error) {
          errorMessage = error.message

          // Extract Google API error codes if available
          if ('code' in error) {
            errorCode = `API_ERROR_${error.code}`
          }
        } else if (typeof error === 'object' && error !== null) {
          // Handle Google API error structure
          if ('code' in error) {
            errorCode = `API_ERROR_${error.code}`
            if ('message' in error) {
              errorMessage = `${error.message} (Code: ${error.code})`
            }
          }
        }

        errors.push({
          fileId: id,
          success: false,
          error: errorMessage,
          errorCode,
        })
      }
    }

    const response = {
      success: errors.length === 0,
      processed: results.length,
      failed: errors.length,
      type: isBulkOperation ? 'bulk' : 'single',
      operation: 'move',
      targetFolderId,
      results,
      errors: errors.length > 0 ? errors : undefined,
      debug: {
        request: requestInfo,
        processedFileIds: fileIds,
        resultsSummary: {
          successful: results.map(r => r.fileId),
          failed: errors.map(e => e.fileId),
        },
      },
    }

    console.log('📤 Move API Response:', {
      success: response.success,
      processed: response.processed,
      failed: response.failed,
      errorsCount: response.errors?.length || 0,
      hasErrors: errors.length > 0,
    })

    return NextResponse.json(response, {
      status: errors.length === 0 ? 200 : 207,
    })
  } catch (error: any) {
    return handleApiError(error)
  }
}
