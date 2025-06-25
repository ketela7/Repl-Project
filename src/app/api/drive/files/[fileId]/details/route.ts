import { NextRequest, NextResponse } from 'next/server'

import {
  initDriveService,
  handleApiError,
  getFileIdFromParams,
} from '@/lib/api-utils'
import { driveCache } from '@/lib/cache'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const fileId = await getFileIdFromParams(params)

    if (!fileId) {
      return NextResponse.json(
        { error: 'File ID is required' },
        { status: 400 }
      )
    }

    const authResult = await initDriveService()
    if (!authResult.success) {
      return authResult.response!
    }

    // Check cache first (5 minute TTL for file details)
    const cacheKey = driveCache.generateFileDetailsKey(
      fileId,
      authResult.session!.user.email || authResult.session!.user.id || ''
    )
    const cachedDetails = driveCache.get(cacheKey)
    if (cachedDetails) {
      return NextResponse.json(cachedDetails)
    }

    const fileDetails = await authResult.driveService!.getFileDetails(fileId)

    // Cache the result for 5 minutes
    driveCache.set(cacheKey, fileDetails, 5)

    return NextResponse.json(fileDetails)
  } catch (error) {
    return handleApiError(error)
  }
}
