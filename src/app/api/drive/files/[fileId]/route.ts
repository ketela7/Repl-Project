import { NextRequest, NextResponse } from 'next/server'

import { GoogleDriveService } from '@/lib/google-drive/service'
import { auth } from '@/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get the access token from session
    const accessToken = session.accessToken

    if (!accessToken) {
      return NextResponse.json(
        {
          error:
            'Google Drive access token not found. Please reconnect your Google account.',
        },
        { status: 401 }
      )
    }

    const { fileId } = await params

    const driveService = new GoogleDriveService(accessToken)
    const file = await driveService.getFile(fileId)

    return NextResponse.json(file)
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
          },
          { status: 401 }
        )
      }

      if (
        error.message.includes('not found') ||
        error.message.includes('404')
      ) {
        return NextResponse.json(
          { error: 'File or folder not found' },
          { status: 404 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Failed to fetch file details' },
      { status: 500 }
    )
  }
}

export async function PUT(
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
        { error: 'Google Drive access not found' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { action, name, parentId, currentParentId } = body
    const { fileId } = await params

    const driveService = new GoogleDriveService(accessToken)
    let result

    switch (action) {
      case 'rename':
        result = await driveService.renameFile(fileId, name)
        break
      case 'move':
        result = await driveService.moveFile(fileId, parentId, currentParentId)
        break
      case 'trash':
        result = await driveService.moveToTrash(fileId)
        break
      case 'restore':
        result = await driveService.restoreFromTrash(fileId)
        break
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    return NextResponse.json(result)
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
        error.message.includes('403') ||
        error.message.includes('sufficient permissions')
      ) {
        return NextResponse.json(
          {
            error:
              'You do not have permission to modify this item. This may be a shared file with restricted access.',
            needsReauth: false,
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
            error: 'File not found',
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

    return NextResponse.json(
      { error: 'Failed to update item' },
      { status: 500 }
    )
  }
}

export async function DELETE(
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
        { error: 'Google Drive access not found' },
        { status: 400 }
      )
    }

    const { fileId } = await params
    const driveService = new GoogleDriveService(accessToken)
    await driveService.deleteFile(fileId)

    return NextResponse.json({ success: true })
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
              'Insufficient permissions to delete files. Please check your Google Drive permissions.',
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
            error: 'File not found',
          },
          { status: 404 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 }
    )
  }
}
