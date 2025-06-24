import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { GoogleDriveService } from '@/lib/google-drive/service'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }


    const accessToken = session.accessToken

    if (!accessToken) {
      return NextResponse.json(
        {
          error:
            'Google Drive access not found. Please reconnect your Google account.',
          needsReauth: true,
        },
        { status: 400 }
      )
    }

    const { fileId } = await params
    const { name, parentId } = await request.json()

    if (!name) {
      return NextResponse.json(
        { error: 'Item name is required' },
        { status: 400 }
      )
    }



    const driveService = new GoogleDriveService(accessToken)
    const copiedFile = await driveService.copyFile(fileId, {
      name,
      parents: parentId ? [parentId] : undefined,
    })

    return NextResponse.json(copiedFile)
  } catch (error) {

    if (error instanceof Error) {
      // Handle Google API specific errors
      if (
        error.message.includes('Invalid Credentials') ||
        error.message.includes('unauthorized')
      ) {
        return NextResponse.json(
          {
            error:
              'Google Drive access expired. Please reconnect your account.',
            needsReauth: true,
          },
          { status: 401 }
        )
      }

      if (
        error.message.includes('insufficient') ||
        error.message.includes('403')
      ) {
        return NextResponse.json(
          {
            error:
              'Insufficient permissions to copy items. Please check your Google Drive permissions.',
            needsReauth: true,
          },
          { status: 403 }
        )
      }

      if (
        error.message.includes('not found') ||
        error.message.includes('404')
      ) {
        return NextResponse.json(
          {
            error: 'Original item not found',
          },
          { status: 404 }
        )
      }

      if (error.message.includes('quota') || error.message.includes('limit')) {
        return NextResponse.json(
          {
            error:
              'Google Drive quota exceeded. Please free up space and try again.',
          },
          { status: 429 }
        )
      }
    }

    return NextResponse.json({ error: 'Failed to copy item' }, { status: 500 })
  }
}
