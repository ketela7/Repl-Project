import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { GoogleDriveService } from '@/lib/google-drive/service'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const pageSize = Math.min(Number(searchParams.get('pageSize')) || 50, 100)
    const folderId = searchParams.get('folderId') || 'root'
    
    const driveService = new GoogleDriveService(session.accessToken)
    
    const result = await driveService.listFiles({
      parentId: folderId,
      pageSize,
      orderBy: 'modifiedTime desc',
    })
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Drive API Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch files' },
      { status: 500 }
    )
  }
}