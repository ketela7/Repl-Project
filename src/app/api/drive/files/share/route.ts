
import { NextRequest, NextResponse } from 'next/server'

import { initDriveService, handleApiError, validateShareRequest } from '@/lib/api-utils'

export async function POST(request: NextRequest) {
  try {
    const authResult = await initDriveService()
    if (!authResult.success) {
      return authResult.response!
    }

    const body = await request.json()
    const { items, action, role, type, emailAddress, message, allowFileDiscovery, expirationTime } = body

    if (!validateShareRequest(body)) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'No items provided' }, { status: 400 })
    }

    const results = []
    const errors = []

    for (const item of items) {
      try {
        let fileResult

        switch (action) {
          case 'get_share_link': {
            const permissions = await authResult.driveService!.getFilePermissions(item.id)
            const publicPermission = permissions.find((p: any) => p.type === 'anyone')

            if (publicPermission) {
              const fileDetails = await authResult.driveService!.getFile(item.id)
              fileResult = {
                shareLink: fileDetails.webViewLink,
                directLink: fileDetails.webContentLink,
                isPublic: true,
              }
            } else {
              fileResult = {
                shareLink: null,
                directLink: null,
                isPublic: false,
                message: 'File is not publicly shared',
              }
            }
            break
          }

          case 'create_share_link': {
            const permission = await authResult.driveService!.addPermission(item.id, {
              type: 'anyone',
              role: 'reader',
              allowFileDiscovery: allowFileDiscovery || false,
            })

            const fileDetails = await authResult.driveService!.getFile(item.id)
            fileResult = {
              shareLink: fileDetails.webViewLink,
              directLink: fileDetails.webContentLink,
              permissionId: permission.id,
              isPublic: true,
            }
            break
          }

          case 'share_with_email': {
            const permission = await authResult.driveService!.addPermission(item.id, {
              type: type || 'user',
              role: role || 'reader',
              emailAddress,
              sendNotificationEmail: true,
              emailMessage: message,
              expirationTime,
            })

            fileResult = {
              permissionId: permission.id,
              emailAddress,
              role: role || 'reader',
              shared: true,
            }
            break
          }

          case 'remove_share': {
            const permissions = await authResult.driveService!.getFilePermissions(item.id)
            const publicPermission = permissions.find((p: any) => p.type === 'anyone')

            if (publicPermission) {
              await authResult.driveService!.removePermission(item.id, publicPermission.id)
              fileResult = {
                shareLink: null,
                isPublic: false,
                removed: true,
              }
            } else {
              fileResult = {
                shareLink: null,
                isPublic: false,
                message: 'File was not publicly shared',
              }
            }
            break
          }

          default:
            throw new Error(`Unknown action: ${action}`)
        }

        results.push({
          id: item.id,
          name: item.name,
          success: true,
          ...fileResult,
        })
      } catch (error: any) {
        errors.push({
          id: item.id,
          name: item.name,
          success: false,
          error: error.message,
        })
      }
    }

    return NextResponse.json({
      results,
      errors,
      total: items.length,
      successCount: results.length,
      errorCount: errors.length,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
