import { NextRequest, NextResponse } from 'next/server'

import {
  initDriveService,
  handleApiError,
  getFileIdFromParams,
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
    const { name, parentId } = await request.json()

    if (!name) {
      return NextResponse.json(
        { error: 'Item name is required' },
        { status: 400 }
      )
    }

    const copiedFile = await authResult.driveService!.copyFile(fileId, {
      name,
      parents: parentId ? [parentId] : undefined,
    })

    return NextResponse.json(copiedFile)
  } catch (error) {
    return handleApiError(error)
  }
}
