import { NextRequest, NextResponse } from 'next/server'

import { initDriveService } from '@/lib/api-utils'

export async function POST(request: NextRequest, { params }: { params: { fileId: string } }) {
  try {
    const authResult = await initDriveService()
    if (!authResult.success) {
      return authResult.response!
    }

    const { driveService } = authResult
    const fileId = (await params).fileId
    const body = await request.json()

    // Global operations approach: Handle both single and bulk with items.length logic
    const { items } = body

    // Determine operation type based on items array
    const fileIds = items && items.length > 0 ? items.map((item: any) => item.id) : [fileId]
    const isBulkOperation = items && items.length > 1

    if (!fileIds || fileIds.length === 0) {
      return NextResponse.json({ error: 'File IDs are required' }, { status: 400 })
    }

    const results = []
    const errors = []

    for (const id of fileIds) {
      try {
        const result = await driveService.restoreFromTrash(id)
        results.push({ fileId: id, success: true, result })
      } catch (error: any) {
        errors.push({
          fileId: id,
          success: false,
          error: error.message || 'Restore failed',
        })
      }
    }

    const response = {
      success: errors.length === 0,
      processed: results.length,
      failed: errors.length,
      type: isBulkOperation ? 'bulk' : 'single',
      operation: 'untrash',
      results,
      errors: errors.length > 0 ? errors : undefined,
    }

    return NextResponse.json(response, {
      status: errors.length === 0 ? 200 : 207,
    })
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to restore files' }, { status: 500 })
  }
}
