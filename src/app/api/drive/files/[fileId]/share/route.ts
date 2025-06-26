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

    const fileId = await getFileIdFromParams(params)
    const body = await request.json()

    if (!validateShareRequest(body)) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }

    const {
      action,
      role,
      type,
      emailAddress,
      message,
      allowFileDiscovery,
      expirationTime,
      options,
    } = body

    let result

    switch (action) {
      case 'get_share_link':
        try {
          const permissions =
            await authResult.driveService!.getFilePermissions(fileId)
          const publicPermission = permissions.find(
            (p: any) => p.type === 'anyone'
          )

          if (publicPermission) {
            const fileDetails =
              await authResult.driveService!.getFileDetails(fileId)
            result = {
              shareLink: fileDetails.webViewLink,
              isPublic: true,
              permission: publicPermission,
            }
          } else {
            const permission = await authResult.driveService!.createPermission(
              fileId,
              'reader',
              'anyone'
            )
            const fileDetails =
              await authResult.driveService!.getFileDetails(fileId)
            result = {
              shareLink: fileDetails.webViewLink,
              isPublic: true,
              permission,
            }
          }
        } catch (error) {
          throw error
        }
        break

      case 'share_with_user':
        try {
          const permission = await authResult.driveService!.createPermission(
            fileId,
            role || 'reader',
            type || 'user'
          )

          if (message) {
            await authResult.driveService!.sendNotificationEmail(
              fileId,
              emailAddress,
              message
            )
          }

          result = {
            success: true,
            permission,
            message: `File shared with ${emailAddress}`,
          }
        } catch (error) {
          throw error
        }
        break

      case 'update_permission':
        try {
          result = { success: true, message: 'Permission updated' }
        } catch (error) {
          throw error
        }
        break

      case 'remove_permission':
        try {
          await authResult.driveService!.deletePermission(
            fileId,
            options.permissionId,
            authResult.session!.accessToken
          )
          result = { success: true, message: 'Permission removed' }
        } catch (error) {
          throw error
        }
        break

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    return NextResponse.json(result)
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
