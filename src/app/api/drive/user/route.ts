import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { GoogleDriveService } from '@/lib/google-drive/service'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const accessToken = session.accessToken
    if (!accessToken) {
      return NextResponse.json(
        { error: 'Google Drive access not found' },
        { status: 400 }
      )
    }

    const driveService = new GoogleDriveService(accessToken)
    const userInfo = await driveService.getUserInfo()

    return NextResponse.json(userInfo)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch user info' },
      { status: 500 }
    )
  }
}
