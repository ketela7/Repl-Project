import { NextRequest, NextResponse } from 'next/server'

import { initDriveService, handleApiError, validateShareRequest } from '@/lib/api-utils'

export async function POST(request: NextRequest) {
  try {
    const authResult = await initDriveService()
    if (!authResult.success) {
      return authResult.response!
    }

    const { driveService } = authResult
    const body = await request.json()

    // Validate share request
    if (!validateShareRequest(body)) {
      return NextResponse.json({ error: 'Invalid share request body' }, { status: 400 })
    }

    // Handle both single and bulk operations
    const { fileId, items, permissions, notifyUsers = false, message } = body

    // Determine operation type based on items array or single fileId
    const fileIds = items && items.length > 0 ? items.map((item: any) => item.id) : [fileId]
    const isBulkOperation = items && items.length > 1

    if (!fileIds || fileIds.length === 0) {
      return NextResponse.json({ error: 'File IDs are required' }, { status: 400 })
    }

    if (!permissions || permissions.length === 0) {
      return NextResponse.json({ error: 'Permissions are required' }, { status: 400 })
    }

    const results = []
    const errors = []

    for (const id of fileIds) {
      try {
        const shareResults = []

        // Apply each permission to the file
        for (const permission of permissions) {
          const shareResult = await driveService.shareFile(id, {
            role: permission.role,
            type: permission.type,
            emailAddress: permission.emailAddress,
            domain: permission.domain,
            sendNotificationEmail: notifyUsers,
          })
          shareResults.push(shareResult)
        }

        results.push({
          fileId: id,
          success: true,
          permissions: shareResults,
          notifyUsers,
          message,
        })
      } catch (error: any) {
        errors.push({
          fileId: id,
          success: false,
          error: error.message || 'Share operation failed',
        })
      }
    }

    const response = {
      success: errors.length === 0,
      processed: results.length,
      failed: errors.length,
      type: isBulkOperation ? 'bulk' : 'single',
      operation: 'share',
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
