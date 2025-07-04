/**
 * Shared API utilities for Google Drive operations
 * Reduces code duplication across API routes
 */
import { NextResponse } from 'next/server'

import { auth } from '@/auth'
import { GoogleDriveService } from '@/lib/google-drive/service'

export interface AuthResult {
  success: boolean
  session?: any
  driveService?: GoogleDriveService
  response?: NextResponse
}

/**
 * Common authentication and drive service initialization
 */
export async function initDriveService(): Promise<AuthResult> {
  try {
    const session = await auth()

    if (!session?.user) {
      return {
        success: false,
        response: NextResponse.json({ error: 'Authentication required' }, { status: 401 }),
      }
    }

    const accessToken = session.accessToken

    if (!accessToken) {
      return {
        success: false,
        response: NextResponse.json(
          {
            error: 'Google Drive access token not found. Please reconnect your Google account.',
            needsReauth: true,
          },
          { status: 401 },
        ),
      }
    }

    const driveService = new GoogleDriveService(accessToken)

    return {
      success: true,
      session,
      driveService,
    }
  } catch (error) {
    console.error('Authentication failed:', error)
    return {
      success: false,
      response: NextResponse.json({ error: 'Authentication failed' }, { status: 500 }),
    }
  }
}

/**
 * Common error handling for API routes
 */
export function handleApiError(error: any): NextResponse {
  if (error instanceof Error) {
    // Handle Google API specific errors
    if (error.message.includes('Invalid Credentials') || error.message.includes('unauthorized')) {
      return NextResponse.json(
        {
          error: 'Google Drive access expired. Please reconnect your account.',
          needsReauth: true,
        },
        { status: 401 },
      )
    }

    if (error.message.includes('not found')) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 })
    }

    if (error.message.includes('quota')) {
      return NextResponse.json(
        { error: 'Google Drive quota exceeded. Please try again later.' },
        { status: 429 },
      )
    }

    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
}

/**
 * Extract file ID from params safely
 */
export async function getFileIdFromParams(params: Promise<{ fileId: string }>): Promise<string> {
  const { fileId } = await params
  return fileId
}

/**
 * Validate request body for specific operations
 */
export function validateShareRequest(body: any): boolean {
  // Check for new format with items array or legacy format with fileId
  return (body.items && Array.isArray(body.items) && body.items.length > 0) || !!body.fileId
}

export function validateDownloadRequest(body: any): boolean {
  // New format for download and other operations
  return !!(body.items && Array.isArray(body.items) && body.items.length > 0)
}

export function validateRenameRequest(body: any): boolean {
  return (
    (body.items && Array.isArray(body.items) && body.items.length > 0) ||
    !!(body.fileId && body.newName)
  )
}
