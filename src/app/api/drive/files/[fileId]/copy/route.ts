import { NextRequest, NextResponse } from 'next/server'

import { initDriveService, handleApiError } from '@/lib/api-utils'

export async function POST(request: NextRequest, { params }: { params: Promise<{ fileId: string }> }) {
  try {
    const authResult = await initDriveService()
    if (!authResult.success) {
      return authResult.response!
    }

    const fileId = (await params).fileId
    const body = await request.json()

    // Global operations approach: Handle both single and bulk with items.length logic
    const { name, parentId, items } = body

    // Determine operation type based on items array
    const fileIds = items && items.length > 0 ? items.map((item: any) => item.id) : [fileId]
    const isBulkOperation = items && items.length > 1

    if (!name && !isBulkOperation) {
      return NextResponse.json({ error: 'Item name is required for single copy' }, { status: 400 })
    }

    const results = []
    const errors = []

    for (const id of fileIds) {
      try {
        const copyName = isBulkOperation
          ? `Copy of ${items.find((item: any) => item.id === id)?.name || 'Unknown'}`
          : name

        const copiedFile = await authResult.driveService!.copyFile(id, {
          name: copyName,
          parents: parentId ? [parentId] : undefined,
        })

        results.push({ fileId: id, success: true, result: copiedFile })
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
      results,
      errors: errors.length > 0 ? errors : undefined,
    }

    return NextResponse.json(response, {
      status: errors.length === 0 ? 200 : 207,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
