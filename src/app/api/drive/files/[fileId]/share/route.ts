import { NextRequest, NextResponse } from 'next/server'

import {
  initDriveService,
  handleApiError,
  getFileIdFromParams,
  validateShareRequest,
} from '@/lib/api-utils'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const authResult = await initDriveService()
    if (!authResult.success) {
      return authResult.response!
    }

    const fileId = (await params).fileId
    const body = await request.json()

    // Global operations approach: Handle both single and bulk with items.length logic
    const {
      action,
      role,
      type,
      emailAddress,
      message,
      allowFileDiscovery,
      expirationTime,
      options,
      items,
    } = body

    // Determine operation type based on items array
    const fileIds =
      items && items.length > 0 ? items.map((item: any) => item.id) : [fileId]
    const isBulkOperation = items && items.length > 1

    if (!validateShareRequest(body)) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }

    const results = []
    const errors = []

    for (const id of fileIds) {
      try {
        let fileResult

        switch (action) {
          case 'get_share_link': {
            const permissions =
              await authResult.driveService!.getFilePermissions(id)
            const publicPermission = permissions.find(
              (p: any) => p.type === 'anyone'
            )

            if (publicPermission) {
              const fileDetails =
                await authResult.driveService!.getFileDetails(id)
              fileResult = {
                shareLink: fileDetails.webViewLink,
                isPublic: true,
                permission: publicPermission,
              }
            } else {
              const permission =
                await authResult.driveService!.createPermission(
                  id,
                  'reader',
                  'anyone'
                )
              const fileDetails =
                await authResult.driveService!.getFileDetails(id)
              fileResult = {
                shareLink: fileDetails.webViewLink,
                isPublic: true,
                permission,
              }
            }
            break
          }

          case 'share_with_user': {
            const permission = await authResult.driveService!.createPermission(
              id,
              role || 'reader',
              type || 'user'
            )

            if (message) {
              await authResult.driveService!.sendNotificationEmail(
                id,
                emailAddress,
                message
              )
            }

            fileResult = {
              success: true,
              permission,
              message: `File shared with ${emailAddress}`,
            }
            break
          }

          case 'update_permission': {
            fileResult = { success: true, message: 'Permission updated' }
            break
          }

          default: {
            throw new Error(`Unknown action: ${action}`)
          }
        }

        results.push({ fileId: id, success: true, result: fileResult })
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
  } catch (error) {
    return handleApiError(error)
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const authResult = await initDriveService()
    if (!authResult.success) {
      return authResult.response!
    }

    const fileId = await getFileIdFromParams(params)
    const permissions =
      await authResult.driveService!.getFilePermissions(fileId)
    const fileDetails = await authResult.driveService!.getFileDetails(fileId)

    return NextResponse.json({
      permissions,
      fileDetails,
      isShared: permissions.length > 1,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
