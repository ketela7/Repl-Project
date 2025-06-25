import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'

import {
  initDriveService,
  handleApiError,
  validateBulkRequest,
} from '@/lib/api-utils'

export async function POST(request: NextRequest) {
  try {
    const authResult = await initDriveService()
    if (!authResult.success) {
      return authResult.response!
    }

    const { operation, fileIds, options } = await request.json()

    if (!validateBulkRequest({ operation, fileIds })) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }

    const oauth2Client = new google.auth.OAuth2()
    oauth2Client.setCredentials({
      access_token: authResult.session!.accessToken,
    })
    const drive = google.drive({ version: 'v3', auth: oauth2Client })

    const results = []

    switch (operation) {
      case 'move':
        for (const fileId of fileIds) {
          try {
            const result = await drive.files.update({
              fileId,
              addParents: options.targetFolderId,
              removeParents: options.currentParentId || 'root',
              fields: 'id,name,parents',
            })
            results.push({ fileId, success: true, data: result.data })
          } catch (error) {
            results.push({
              fileId,
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error',
            })
          }
        }
        break

      case 'copy':
        for (const fileId of fileIds) {
          try {
            const result = await drive.files.copy({
              fileId,
              requestBody: {
                name: options.namePrefix
                  ? `${options.namePrefix} ${await getFileName(drive, fileId)}`
                  : undefined,
                parents: options.targetFolderId
                  ? [options.targetFolderId]
                  : undefined,
              },
              fields: 'id,name,parents',
            })
            results.push({ fileId, success: true, data: result.data })
          } catch (error) {
            results.push({
              fileId,
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error',
            })
          }
        }
        break

      case 'trash':
        for (const fileId of fileIds) {
          try {
            const result = await drive.files.update({
              fileId,
              requestBody: { trashed: true },
              fields: 'id,name,trashed',
            })
            results.push({ fileId, success: true, data: result.data })
          } catch (error) {
            results.push({
              fileId,
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error',
            })
          }
        }
        break

      case 'restore':
        for (const fileId of fileIds) {
          try {
            const result = await drive.files.update({
              fileId,
              requestBody: { trashed: false },
              fields: 'id,name,trashed',
            })
            results.push({ fileId, success: true, data: result.data })
          } catch (error) {
            results.push({
              fileId,
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error',
            })
          }
        }
        break

      case 'delete':
        for (const fileId of fileIds) {
          try {
            await drive.files.delete({ fileId })
            results.push({ fileId, success: true, data: { deleted: true } })
          } catch (error) {
            results.push({
              fileId,
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error',
            })
          }
        }
        break

      default:
        return NextResponse.json(
          { error: 'Invalid operation' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      operation,
      results,
      summary: {
        total: fileIds.length,
        successful: results.filter((r) => r.success).length,
        failed: results.filter((r) => !r.success).length,
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}

async function getFileName(drive: any, fileId: string): Promise<string> {
  try {
    const result = await drive.files.get({ fileId, fields: 'name' })
    return result.data.name || 'Untitled'
  } catch {
    return 'Untitled'
  }
}
