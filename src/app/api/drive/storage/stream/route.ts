import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { createDriveClient } from '@/lib/google-drive/config'

/**
 * Progressive Storage Analytics with Server-Sent Events
 * Streams data in real-time as it's being processed
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.accessToken) {
      return new Response('Authentication required', { status: 401 })
    }

    const drive = createDriveClient(session.accessToken)

    // Setup Server-Sent Events stream
    const stream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder()
        
        const sendData = (type: string, data: any) => {
          const message = `data: ${JSON.stringify({ type, data, timestamp: Date.now() })}\n\n`
          controller.enqueue(encoder.encode(message))
        }

        const loadProgressively = async () => {
          try {
            // Step 1: Send basic system info immediately (fastest)
            sendData('progress', { step: 'system_info', message: 'Getting system information...' })
            
            const aboutResponse = await drive.about.get({
              fields: 'storageQuota,user,maxUploadSize,canCreateDrives'
            })
            
            const storageQuota = aboutResponse.data.storageQuota
            const basicQuota = {
              limit: storageQuota?.limit ? parseInt(storageQuota.limit) : null,
              used: storageQuota?.usage ? parseInt(storageQuota.usage) : 0,
              usedInDrive: storageQuota?.usageInDrive ? parseInt(storageQuota.usageInDrive) : 0,
              available: storageQuota?.limit ? parseInt(storageQuota.limit) - parseInt(storageQuota.usage || '0') : null,
              usagePercentage: storageQuota?.limit ? Math.round((parseInt(storageQuota.usage || '0') / parseInt(storageQuota.limit)) * 100) : null,
            }

            sendData('quota_update', basicQuota)

            // Step 2: Start file analysis in chunks
            sendData('progress', { step: 'file_analysis', message: 'Analyzing files...' })
            
            let allFiles: any[] = []
            let pageToken: string | undefined
            let totalProcessed = 0
            const filesByType: Record<string, number> = {}
            const fileSizesByType: Record<string, number> = {}
            const largestFiles: any[] = []

            // Process files in chunks of 1000 (maximum pageSize) to minimize API calls
            do {
              // Create timeout promise for individual API request (55s per request)
              const apiTimeout = new Promise<never>((_, reject) => {
                setTimeout(() => reject(new Error('API request timeout after 55 seconds')), 55000)
              })

              const apiCall = drive.files.list({
                q: 'trashed=false',
                pageSize: 1000, // Maximum pageSize to reduce API calls
                pageToken,
                fields: 'nextPageToken,files(id,name,mimeType,size,webViewLink,createdTime)',
                orderBy: 'modifiedTime desc',
                supportsAllDrives: true,
                includeItemsFromAllDrives: true,
              })

              let response
              try {
                // Race between API call and timeout
                response = await Promise.race([apiCall, apiTimeout])
              } catch (error: any) {
                if (error.message.includes('timeout')) {
                  sendData('progress', { 
                    step: 'api_timeout', 
                    message: `API request timeout after 55s. Processed ${totalProcessed} files.`,
                    isComplete: true,
                    canContinue: !!pageToken,
                    nextPageToken: pageToken
                  })
                  break
                }
                throw error // Re-throw other errors
              }

              const files = response.data.files || []
              allFiles = [...allFiles, ...files]
              pageToken = response.data.nextPageToken || undefined
              totalProcessed += files.length

              // Process this chunk
              files.forEach(file => {
                const mimeType = file.mimeType || 'unknown'
                const size = file.size ? parseInt(file.size) : 0
                
                // Count by type
                filesByType[mimeType] = (filesByType[mimeType] || 0) + 1
                fileSizesByType[mimeType] = (fileSizesByType[mimeType] || 0) + size

                // Track largest files
                if (size > 0) {
                  largestFiles.push({
                    name: file.name,
                    size,
                    mimeType,
                    id: file.id,
                    webViewLink: file.webViewLink
                  })
                  
                  // Keep only top 20, sorted by size
                  largestFiles.sort((a, b) => b.size - a.size)
                  if (largestFiles.length > 20) {
                    largestFiles.splice(20)
                  }
                }
              })

              // Send incremental update
              sendData('files_update', {
                totalFiles: totalProcessed,
                filesByType: { ...filesByType },
                fileSizesByType: { ...fileSizesByType },
                largestFiles: [...largestFiles],
                hasMore: !!pageToken
              })

              sendData('progress', { 
                step: 'file_analysis', 
                message: `Processed ${totalProcessed} files...`,
                processed: totalProcessed
              })

              // Small delay to prevent overwhelming the client and rate limiting
              await new Promise(resolve => setTimeout(resolve, 50))

            } while (pageToken)

            // Final summary
            const totalSize = Object.values(fileSizesByType).reduce((sum, size) => sum + size, 0)
            
            sendData('final_summary', {
              totalFiles: totalProcessed,
              totalSizeBytes: totalSize,
              filesByType,
              fileSizesByType,
              largestFiles,
              processingComplete: true,
              accuracy: 'Complete'
            })

            sendData('complete', { message: 'Analysis complete!' })

          } catch (error: any) {
            try {
              sendData('error', { 
                message: error.message || 'Analysis failed',
                canRetry: true 
              })
            } catch {
              // Controller might be closed already
            }
          } finally {
            try {
              controller.close()
            } catch {
              // Controller already closed, ignore
            }
          }
        }

        loadProgressively()
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })

  } catch (error: any) {
    console.error('Storage stream error:', error)
    return new Response('Failed to start analysis stream', { status: 500 })
  }
}