import { NextRequest, NextResponse } from 'next/server'

import {
  initDriveService,
  handleApiError,
  getFileIdFromParams,
} from '@/lib/api-utils'

// MIME type mappings for Google Workspace exports
const EXPORT_MIME_TYPES = {
  // Google Docs
  'application/vnd.google-apps.document': {
    pdf: 'application/pdf',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    odt: 'application/vnd.oasis.opendocument.text',
    rtf: 'application/rtf',
    txt: 'text/plain',
    html: 'text/html',
    epub: 'application/epub+zip',
  },
  // Google Sheets
  'application/vnd.google-apps.spreadsheet': {
    pdf: 'application/pdf',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ods: 'application/vnd.oasis.opendocument.spreadsheet',
    csv: 'text/csv',
    tsv: 'text/tab-separated-values',
    html: 'text/html',
  },
  // Google Slides
  'application/vnd.google-apps.presentation': {
    pdf: 'application/pdf',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    odp: 'application/vnd.oasis.opendocument.presentation',
    txt: 'text/plain',
    jpeg: 'image/jpeg',
    png: 'image/png',
    svg: 'image/svg+xml',
  },
  // Google Drawings
  'application/vnd.google-apps.drawing': {
    pdf: 'application/pdf',
    svg: 'image/svg+xml',
    png: 'image/png',
    jpeg: 'image/jpeg',
  },
}

// File extensions for download
const FILE_EXTENSIONS = {
  pdf: 'pdf',
  docx: 'docx',
  odt: 'odt',
  rtf: 'rtf',
  txt: 'txt',
  html: 'html',
  epub: 'epub',
  xlsx: 'xlsx',
  ods: 'ods',
  csv: 'csv',
  tsv: 'tsv',
  pptx: 'pptx',
  odp: 'odp',
  svg: 'svg',
  png: 'png',
  jpeg: 'jpg',
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
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'pdf'

    // Get file metadata first to check if it's exportable
    const fileDetails = await authResult.driveService!.getFile(fileId)

    if (!fileDetails) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Check if file is a Google Workspace file
    if (!fileDetails.mimeType.startsWith('application/vnd.google-apps.')) {
      return NextResponse.json(
        {
          error: 'Only Google Workspace files can be exported',
        },
        { status: 400 }
      )
    }

    // Get the available export formats for this file type
    const availableFormats =
      EXPORT_MIME_TYPES[fileDetails.mimeType as keyof typeof EXPORT_MIME_TYPES]

    if (!availableFormats) {
      return NextResponse.json(
        {
          error: 'This file type cannot be exported',
        },
        { status: 400 }
      )
    }

    if (!availableFormats[format as keyof typeof availableFormats]) {
      return NextResponse.json(
        {
          error: `Format '${format}' is not available for this file type`,
          availableFormats: Object.keys(availableFormats),
        },
        { status: 400 }
      )
    }

    // Get the target MIME type
    const targetMimeType =
      availableFormats[format as keyof typeof availableFormats]

    // Export the file
    const exportedData = await authResult.driveService!.exportFile(
      fileId,
      targetMimeType
    )

    if (!exportedData) {
      return NextResponse.json(
        { error: 'Failed to export file' },
        { status: 500 }
      )
    }

    // Generate filename with appropriate extension
    const extension =
      FILE_EXTENSIONS[format as keyof typeof FILE_EXTENSIONS] || format
    const filename = `${fileDetails.name}.${extension}`

    // Return the exported file
    return new NextResponse(exportedData, {
      status: 200,
      headers: {
        'Content-Type': targetMimeType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'private, no-cache',
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
