'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { RefreshCw, HardDrive, Files, TrendingUp, Play, Pause } from 'lucide-react'

interface QuotaData {
  limit: number | null
  used: number
  usedInDrive: number
  available: number | null
  usagePercentage: number | null
}

interface FilesData {
  totalFiles: number
  filesByType: Record<string, number>
  fileSizesByType: Record<string, number>
  largestFiles: Array<{
    name: string
    size: number
    mimeType: string
    id: string
    webViewLink?: string
  }>
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

  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected')
  
  const eventSourceRef = useRef<EventSource | null>(null)

  const formatBytes = (bytes: number | string | undefined): string => {
    // Safe number parsing for file sizes
    let numBytes = 0
    if (typeof bytes === 'string') {
      const parsed = parseInt(bytes, 10)
      numBytes = isNaN(parsed) ? 0 : parsed
    } else if (typeof bytes === 'number') {
      numBytes = isNaN(bytes) ? 0 : bytes
    }
    
    if (numBytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(numBytes) / Math.log(k))
    return parseFloat((numBytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const startAnalysis = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    setIsLoading(true)
    setError(null)
    setIsComplete(false)
    setConnectionStatus('connecting')
    setProgress({ step: 'initializing', message: 'Starting analysis...' })

    const eventSource = new EventSource('/api/drive/storage/stream')
    eventSourceRef.current = eventSource

    // Auto-close connection after 60 seconds (align with server timeout)
    const timeoutId = setTimeout(() => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
        setIsLoading(false)
        setConnectionStatus('disconnected')
        setError('Analysis timeout after 60 seconds. Large drives may require multiple sessions.')
      }
    }, 60000)

    eventSource.onopen = () => {
      setConnectionStatus('connected')
    }

    eventSource.onmessage = (event) => {
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
            // API sends { user, quota } but we only need quota
            if (data.data.quota) {
              setQuota(data.data.quota)
            } else {
              setQuota(data.data)
            }
            break
            
          case 'files_update':
          case 'file_stats_update':
            setFiles(data.data)
            break
            
          case 'final_summary':
          case 'analysis_complete':
            setFiles(data.data)
            break
            
          case 'complete':
            clearTimeout(timeoutId)
            setIsLoading(false)
            setIsComplete(true)
            setConnectionStatus('disconnected')
            setProgress({ step: 'complete', message: 'Analysis complete!' })
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
    
    return Object.entries(files.filesByType)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([type, count]) => ({
        type: type.split('/')[1] || type,
        count,
        size: files.fileSizesByType?.[type] || 0
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
            <Button onClick={stopAnalysis} variant="destructive" className="flex items-center gap-2">
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
                <span className="text-sm font-medium">
                  {progress?.message || 'Processing...'}
                </span>
                {isLoading && (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                )}
              </div>
              
              {progress?.processed && (
                <div className="space-y-1">
                  <Progress value={Math.min(100, (progress.processed / 10000) * 100)} />
                  <p className="text-xs text-muted-foreground">
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
                    <span>{formatBytes(quota.used)}</span>
                  </div>
                  <Progress value={quota.usagePercentage || 0} />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{formatBytes(quota.usedInDrive)} in Drive</span>
                    <span>{quota.available ? formatBytes(quota.available) : '∞'} available</span>
                  </div>
                </div>
              )}
              
              {!quota.limit && (
                <div className="text-center py-4">
                  <p className="text-lg font-medium">Unlimited Storage</p>
                  <p className="text-muted-foreground">
                    Using {formatBytes(quota.used)} total
                  </p>
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
                  <span className="font-medium">
                    {formatBytes(files.fileSizesByType ? 
                      Object.values(files.fileSizesByType).reduce((sum, size) => {
                        const numSize = typeof size === 'number' ? size : parseInt(String(size || 0), 10) || 0
                        return sum + numSize
                      }, 0) : 0)}
                  </span>
                </div>
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
                      <p className="text-xs text-muted-foreground">{count} files</p>
                    </div>
                    <span className="text-sm">{formatBytes(size)}</span>
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
            <CardDescription>Top {files.largestFiles.length} largest files in your Drive</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              <div className="space-y-2">
                {files.largestFiles.map((file, index) => (
                  <div key={file.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium" title={file.name}>
                        {file.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {file.mimeType.split('/')[1]}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{formatBytes(file.size)}</span>
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