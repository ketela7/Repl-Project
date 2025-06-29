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
    const { fileId, items, permissions, accessLevel, linkAccess, notifyUsers = false, message } = body

    // Determine operation type based on items array or single fileId
    const fileIds = items && items.length > 0 ? items.map((item: any) => item.id) : [fileId]
    const isBulkOperation = items && items.length > 1

    if (!fileIds || fileIds.length === 0) {
      return NextResponse.json({ error: 'File IDs are required' }, { status: 400 })
    }

    // Build permissions from accessLevel and linkAccess if not provided directly
    let sharePermissions = permissions
    if (!sharePermissions && accessLevel && linkAccess) {
      sharePermissions = [
        {
          role: accessLevel === 'writer' ? 'writer' : accessLevel === 'commenter' ? 'commenter' : 'reader',
          type: linkAccess === 'anyone' ? 'anyone' : linkAccess === 'domain' ? 'domain' : 'anyone',
        },
      ]
    }

    if (!sharePermissions || sharePermissions.length === 0) {
      return NextResponse.json({ error: 'Share permissions are required' }, { status: 400 })
    }

    const results = []
    const errors = []

    for (const id of fileIds) {
      try {
        // Apply each permission to the file
        for (const permission of sharePermissions) {
          await driveService.shareFile(id, {
            role: permission.role,
            type: permission.type,
            emailAddress: permission.emailAddress,
            domain: permission.domain,
            sendNotificationEmail: notifyUsers,
          })
        }

        // Get the file details to generate share link
        const fileDetails = await driveService.drive.files.get({
          fileId: id,
          fields: 'id,name,mimeType,webViewLink',
        })

        const shareLink = fileDetails.data.webViewLink || `https://drive.google.com/file/d/${id}/view`

        results.push({
          fileId: id,
          success: true,
          shareLink,
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
      total: fileIds.length,
      type: isBulkOperation ? 'bulk' : 'single',
      operation: 'share',
      shareLink: results.length > 0 ? results[0].shareLink : undefined,
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
