import { NextRequest, NextResponse } from 'next/server'

import {
  initDriveService,
  handleApiError,
  getFileIdFromParams,
} from '@/lib/api-utils'

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
    const file = await authResult.driveService!.getFile(fileId)

    return NextResponse.json(file)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const authResult = await initDriveService()
    if (!authResult.success) {
      return authResult.response!
    }

    const body = await request.json()
    const { action, name, parentId, currentParentId } = body
    const fileId = await getFileIdFromParams(params)

    let result

    switch (action) {
      case 'rename':
        result = await authResult.driveService!.renameFile(fileId, name)
        break
      case 'move':
        result = await authResult.driveService!.moveFile(
          fileId,
          parentId,
          currentParentId
        )
        break
      case 'trash':
        result = await authResult.driveService!.moveToTrash(fileId)
        break
      case 'restore':
        result = await authResult.driveService!.restoreFromTrash(fileId)
        break
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const authResult = await initDriveService()
    if (!authResult.success) {
      return authResult.response!
    }

    const fileId = await getFileIdFromParams(params)
    await authResult.driveService!.deleteFile(fileId)

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}
