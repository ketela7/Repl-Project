import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { google } from 'googleapis'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { operation, fileIds, options } = await request.json()
    
    const oauth2Client = new google.auth.OAuth2()
    oauth2Client.setCredentials({ access_token: session.accessToken })
    const drive = google.drive({ version: 'v3', auth: oauth2Client })
    auth.setCredentials({ access_token: session.accessToken })
    const drive = google.drive({ version: 'v3', auth })

    const results = []

    switch (operation) {
      case 'move':
        for (const fileId of fileIds) {
          try {
            const result = await drive.files.update({
              fileId,
              addParents: options.targetFolderId,
              removeParents: options.currentParentId || 'root',
              fields: 'id,name,parents'
            })
            results.push({ id: fileId, success: true, data: result.data })
          } catch (error: any) {
            results.push({ id: fileId, success: false, error: error.message })
          }
        }
        break

      case 'copy':
        for (const fileId of fileIds) {
          try {
            const result = await drive.files.copy({
              fileId,
              requestBody: {
                parents: [options.targetFolderId || 'root'],
                name: options.newName || undefined
              },
              fields: 'id,name,parents'
            })
            results.push({ id: fileId, success: true, data: result.data })
          } catch (error: any) {
            results.push({ id: fileId, success: false, error: error.message })
          }
        }
        break

      case 'delete':
        for (const fileId of fileIds) {
          try {
            await drive.files.update({
              fileId,
              requestBody: { trashed: true },
              fields: 'id,name,trashed'
            })
            results.push({ id: fileId, success: true })
          } catch (error: any) {
            results.push({ id: fileId, success: false, error: error.message })
          }
        }
        break

      case 'restore':
        for (const fileId of fileIds) {
          try {
            await drive.files.update({
              fileId,
              requestBody: { trashed: false },
              fields: 'id,name,trashed'
            })
            results.push({ id: fileId, success: true })
          } catch (error: any) {
            results.push({ id: fileId, success: false, error: error.message })
          }
        }
        break

      case 'permanently_delete':
        for (const fileId of fileIds) {
          try {
            await drive.files.delete({ fileId })
            results.push({ id: fileId, success: true })
          } catch (error: any) {
            results.push({ id: fileId, success: false, error: error.message })
          }
        }
        break

      case 'rename':
        for (let i = 0; i < fileIds.length; i++) {
          const fileId = fileIds[i]
          try {
            let newName = options.pattern
            
            // Apply rename pattern
            if (options.type === 'prefix') {
              newName = `${options.pattern}${options.originalNames[i]}`
            } else if (options.type === 'suffix') {
              const name = options.originalNames[i]
              const lastDot = name.lastIndexOf('.')
              if (lastDot > 0) {
                newName = `${name.substring(0, lastDot)}${options.pattern}${name.substring(lastDot)}`
              } else {
                newName = `${name}${options.pattern}`
              }
            } else if (options.type === 'numbered') {
              newName = `${options.pattern} ${i + 1}`
            } else if (options.type === 'timestamp') {
              const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
              newName = `${options.originalNames[i]}_${timestamp}`
            }

            const result = await drive.files.update({
              fileId,
              requestBody: { name: newName },
              fields: 'id,name'
            })
            results.push({ id: fileId, success: true, data: result.data })
          } catch (error: any) {
            results.push({ id: fileId, success: false, error: error.message })
          }
        }
        break

      case 'share':
        for (const fileId of fileIds) {
          try {
            // Create permission
            await drive.permissions.create({
              fileId,
              requestBody: {
                role: options.role || 'reader',
                type: options.type || 'anyone'
              }
            })

            // Get shareable link
            const file = await drive.files.get({
              fileId,
              fields: 'webViewLink,webContentLink'
            })

            results.push({ 
              id: fileId, 
              success: true, 
              shareLink: file.data.webViewLink,
              downloadLink: file.data.webContentLink 
            })
          } catch (error: any) {
            results.push({ id: fileId, success: false, error: error.message })
          }
        }
        break

      default:
        return NextResponse.json({ error: 'Invalid operation' }, { status: 400 })
    }

    const successCount = results.filter(r => r.success).length
    const failureCount = results.filter(r => !r.success).length

    return NextResponse.json({
      success: true,
      results,
      summary: {
        total: fileIds.length,
        successful: successCount,
        failed: failureCount
      }
    })

  } catch (error: any) {
    console.error('Bulk operation error:', error)
    return NextResponse.json(
      { error: 'Failed to perform bulk operation' },
      { status: 500 }
    )
  }
}