'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { RefreshCw, HardDrive, Files, TrendingUp, Play, Pause } from 'lucide-react'
import { formatFileSize } from '@/lib/google-drive/utils'
import { getFileTypeCategories, countFilesByCategory, FILE_TYPE_CATEGORIES } from '@/lib/mime-type-filter'

interface QuotaData {
  limit: number | null
  used: number
  usedInDrive: number
  available: number | null
  usagePercentage: number | null
}

interface FilesData {
  totalFiles: number
  totalSizeBytes?: number
  filesByType:
    | Array<{
        mimeType: string
        count: number
        totalSize?: number
        averageSize?: number
      }>
    | Record<string, number>
  fileSizesByType: Record<string, number>
  largestFiles: Array<{
    name: string
    size: number
    mimeType: string
    id: string
    webViewLink?: string
    modifiedTime?: string
  }>
  categories?: {
    documents: number
    images: number
    videos: number
    audio: number
    spreadsheets?: number
    presentations?: number
    folders?: number
    other: number
  }
  hasMore: boolean
}

interface ProgressData {
  step: string
  message: string
  processed?: number
  isComplete?: boolean
}

export function ProgressiveStorageAnalytics() {
  const [quota, setQuota] = useState<QuotaData | null>(null)
  const [files, setFiles] = useState<FilesData | null>(null)

  const [progress, setProgress] = useState<ProgressData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isComplete, setIsComplete] = useState(false)

  const [connectionStatus, setConnectionStatus] = useState<
    'disconnected' | 'connecting' | 'connected'
  >('disconnected')

  const eventSourceRef = useRef<EventSource | null>(null)



  const startAnalysis = async () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    setIsLoading(true)
    setError(null)
    setIsComplete(false)
    setProgress({ step: 'initializing', message: 'Starting analysis...' })

    // Direct SSE streaming for real-time updates
    setConnectionStatus('connecting')
    const eventSource = new EventSource('/api/drive/storage/stream')
    eventSourceRef.current = eventSource

    // Auto-close connection after 60 seconds (align with server timeout)
    const timeoutId = setTimeout(() => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
        setIsLoading(false)
        setConnectionStatus('disconnected')
        setError('Analysis timeout after 55 seconds. Large drives may require multiple sessions.')
      }
    }, 55000)

    eventSource.onopen = () => {
      setConnectionStatus('connected')
    }

    eventSource.onmessage = event => {
      try {
        const data = JSON.parse(event.data)

        switch (data.type) {
          case 'progress':
            setProgress(data.data)
            if (data.data.isComplete) {
              setIsComplete(true)
            }
            break

          case 'quota_update':
            // Backend sends { user, quota }
            if (data.data.quota) {
              setQuota(data.data.quota)
            }
            break

          case 'progress_update':
            // Real-time progress updates from backend
            setProgress({
              step: 'processing',
              message: `Processing files... ${data.data.totalProcessed} files analyzed`,
              processed: data.data.totalProcessed,
            })
            break

          case 'file_stats_update':
            // Real-time file statistics updates
            setFiles(prevFiles => ({
              ...prevFiles,
              totalFiles: data.data.totalFiles,
              totalSizeBytes: data.data.totalSizeBytes || prevFiles?.totalSizeBytes || 0,
              filesByType: data.data.topFileTypes || prevFiles?.filesByType || [],
              largestFiles: data.data.largestFiles || prevFiles?.largestFiles || [],
              fileSizesByType: prevFiles?.fileSizesByType || {},
              categories: prevFiles?.categories,
              hasMore: false,
            }))
            break

          case 'analysis_complete':
            // Final comprehensive results
            setFiles({
              totalFiles: data.data.summary?.totalFiles || 0,
              totalSizeBytes: data.data.summary?.totalSizeBytes || 0,
              filesByType: data.data.filesByType || [],
              fileSizesByType: Object.fromEntries(data.data.fileSizesByType || []),
              largestFiles: data.data.largestFiles || [],
              categories: data.data.categories,
              hasMore: false,
            })
            break

          case 'complete':
            clearTimeout(timeoutId)
            setIsLoading(false)
            setIsComplete(true)
            setConnectionStatus('disconnected')
            setProgress({
              step: 'complete',
              message: data.data.message || 'Analysis complete!',
              processed: data.data.totalProcessed,
            })
            eventSource.close()
            break

          case 'error':
            clearTimeout(timeoutId)
            setError(data.data.message)
            setIsLoading(false)
            setConnectionStatus('disconnected')
            eventSource.close()
            break
        }
      } catch (err) {
        console.error('Failed to parse SSE data:', err)
      }
    }

    eventSource.onerror = () => {
      clearTimeout(timeoutId)
      setConnectionStatus('disconnected')
      setIsLoading(false)
      setError('Connection lost. Please try again.')
      eventSource.close()
    }
  }

  const stopAnalysis = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
    setIsLoading(false)
    setConnectionStatus('disconnected')
  }

  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }
    }
  }, [])

  const getTopFileTypes = () => {
    if (!files?.filesByType) return []

    // Backend sends array format: [["mimeType", count], ["mimeType", count]]
    if (Array.isArray(files.filesByType)) {
      // If it's array of objects from file_stats_update
      if (
        files.filesByType.length > 0 &&
        typeof files.filesByType[0] === 'object' &&
        'type' in files.filesByType[0]
      ) {
        return files.filesByType.slice(0, 20).map(item => ({
          type: item.type?.split('/')[1] || item.type || 'unknown',
          count: item.count || 0,
          size: item.totalSize || 0,
          averageSize: 0,
        }))
      }

      // If it's array of arrays from analysis_complete: [["mimeType", count]]
      return files.filesByType.slice(0, 20).map(([mimeType, count]) => ({
        type: mimeType?.split('/')[1] || mimeType || 'unknown',
        count: count || 0,
        size: files.fileSizesByType?.[mimeType] || 0,
        averageSize: 0,
      }))
    }

    // Fallback for object format
    return Object.entries(files.filesByType)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 20)
      .map(([type, count]) => ({
        type: type.split('/')[1] || type,
        count: count as number,
        size: files.fileSizesByType?.[type] || 0,
        averageSize: 0,
      }))
  }

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Live Storage Analytics</h2>
          <p className="text-muted-foreground">Real-time analysis of your Google Drive</p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant={connectionStatus === 'connected' ? 'default' : 'secondary'}>
            {connectionStatus === 'connected' ? 'Live' : 'Offline'}
          </Badge>

          {!isLoading ? (
            <Button onClick={startAnalysis} className="flex items-center gap-2">
              <Play className="h-4 w-4" />
              {isComplete ? 'Restart Analysis' : 'Start Analysis'}
            </Button>
          ) : (
            <Button
              onClick={stopAnalysis}
              variant="destructive"
              className="flex items-center gap-2"
            >
              <Pause className="h-4 w-4" />
              Stop
            </Button>
          )}
        </div>
      </div>

      {/* Progress Indicator */}
      {(isLoading || progress) && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{progress?.message || 'Processing...'}</span>
                {isLoading && <RefreshCw className="h-4 w-4 animate-spin" />}
              </div>

              {progress?.processed && (
                <div className="space-y-1">
                  <Progress value={Math.min(100, (progress.processed / 10000) * 100)} />
                  <p className="text-muted-foreground text-xs">
                    {progress.processed.toLocaleString()} files processed
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
            <Button onClick={startAnalysis} className="mt-2" variant="outline">
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Storage Quota */}
      {quota && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="h-5 w-5" />
              Storage Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {quota.limit && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Used</span>
                    <span>{formatFileSize(quota.used)}</span>
                  </div>
                  <Progress value={quota.usagePercentage || 0} />
                  <div className="text-muted-foreground flex justify-between text-xs">
                    <span>{formatFileSize(quota.usedInDrive)} in Drive</span>
                    <span>{quota.available ? formatFileSize(quota.available) : '∞'} available</span>
                  </div>
                </div>
              )}

              {!quota.limit && (
                <div className="py-4 text-center">
                  <p className="text-lg font-medium">Unlimited Storage</p>
                  <p className="text-muted-foreground">Using {formatFileSize(quota.used)} total</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Files Statistics */}
      {files && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Files Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Files className="h-5 w-5" />
                Files Overview
              </CardTitle>
              <CardDescription>
                {files.hasMore ? 'Sample data (more files available)' : 'Complete analysis'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Total Files</span>
                  <span className="font-medium">{(files.totalFiles || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Size</span>
                  <span className="font-medium">{formatFileSize(files.totalSizeBytes || 0)}</span>
                </div>

                {/* File Categories - All 27 Categories */}
                {files.categories && (
                  <div className="space-y-2 border-t pt-3">
                    <h4 className="text-sm font-medium">File Categories</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs max-h-64 overflow-y-auto">
                      {Object.entries(FILE_TYPE_CATEGORIES).map(([categoryId, category]) => {
                        const count = files.categories[categoryId] || 0
                        const Icon = category.icon
                        return count > 0 ? (
                          <div key={categoryId} className="flex items-center justify-between">
                            <div className="flex items-center gap-1">
                              <Icon className="h-3 w-3" />
                              <span>{category.label}</span>
                            </div>
                            <span className="font-medium">{count.toLocaleString()}</span>
                          </div>
                        ) : null
                      })}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Top File Types */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Top File Types
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {getTopFileTypes().map(({ type, count, size }) => (
                  <div key={type} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{type}</p>
                      <p className="text-muted-foreground text-xs">{count} files</p>
                    </div>
                    <span className="text-sm">{formatFileSize(size)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Largest Files */}
      {files?.largestFiles && files.largestFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Largest Files</CardTitle>
            <CardDescription>
              Top {files.largestFiles.length} largest files in your Drive
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              <div className="space-y-2">
                {files.largestFiles.map((file, index) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium" title={file.name}>
                        {file.name}
                      </p>
                      <p className="text-muted-foreground text-xs">{file.mimeType.split('/')[1]}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{formatFileSize(file.size)}</span>
                      <Badge variant="secondary">#{index + 1}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
