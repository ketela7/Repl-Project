'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  RefreshCw,
  HardDrive,
  Files,
  TrendingUp,
  Play,
  Pause,
  Copy,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'
import { formatFileSize } from '@/lib/google-drive/utils'
import { FILE_TYPE_CATEGORIES } from '@/lib/mime-type-filter'
import { DuplicateBulkOperationsDialog } from './duplicate-bulk-operations-dialog'

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
  duplicateFiles?: Array<{
    identifier: string
    type: 'md5' | 'filename'
    files: Array<{
      id: string
      name: string
      size: number
      mimeType: string
      webViewLink?: string
      modifiedTime?: string
    }>
    totalSize: number
    wastedSpace: number
    // Legacy support
    md5Hash?: string
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

  // Bulk duplicate action dialog state
  const [isDuplicateBulkActionOpen, setIsDuplicateBulkActionOpen] = useState(false)

  const eventSourceRef = useRef<EventSource | null>(null)

  // Handle bulk duplicate actions
  const handleDuplicateBulkAction = () => {
    setIsDuplicateBulkActionOpen(true)
  }

  const handleCloseDuplicateBulkAction = () => {
    setIsDuplicateBulkActionOpen(false)
  }

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
              categories: prevFiles?.categories || {
                documents: 0,
                images: 0,
                videos: 0,
                audio: 0,
                spreadsheets: 0,
                presentations: 0,
                folders: 0,
                other: 0,
              },
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
              duplicateFiles: data.data.duplicateFiles || [],
              categories: data.data.categories || {
                documents: 0,
                images: 0,
                videos: 0,
                audio: 0,
                spreadsheets: 0,
                presentations: 0,
                folders: 0,
                other: 0,
              },
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

    eventSource.onerror = async () => {
      clearTimeout(timeoutId)
      setConnectionStatus('disconnected')
      setIsLoading(false)

      // Check if it's a 401 authentication error
      try {
        const sessionResponse = await fetch('/api/auth/session')
        if (sessionResponse.status === 401 || !sessionResponse.ok) {
          setError('Authentication expired. Please refresh the page and sign in again.')
        } else {
          setError('Connection lost. Please try again.')
        }
      } catch {
        setError('Connection lost. Please try again.')
      }

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
        return files.filesByType.slice(0, 50).map(item => ({
          type: item.mimeType?.split('/')[1] || item.mimeType || 'unknown',
          count: item.count || 0,
          size: item.totalSize || 0,
          averageSize: 0,
        }))
      }

      // If it's array of arrays from analysis_complete: [["mimeType", count]]
      if (Array.isArray(files.filesByType[0])) {
        return (files.filesByType as any)
          .slice(0, 50)
          .map(([mimeType, count]: [string, number]) => ({
            type: mimeType?.split('/')[1] || mimeType || 'unknown',
            count: count || 0,
            size: files.fileSizesByType?.[mimeType] || 0,
            averageSize: 0,
          }))
      }
    }

    // Fallback for object format
    return Object.entries(files.filesByType)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 50)
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
                  <Progress
                    value={
                      isComplete
                        ? 100
                        : Math.min(
                            95,
                            (progress.processed / Math.max(progress.processed, 1000)) * 100,
                          )
                    }
                  />
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
          {/* Files Summary with Collapsible */}
          <Card>
            <Collapsible defaultOpen={true}>
              <CardHeader className="pb-2">
                <CollapsibleTrigger className="hover:bg-muted/50 -m-2 flex w-full items-center justify-between rounded-md p-2 transition-colors">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Files className="h-5 w-5" />
                      Files Overview
                    </CardTitle>
                    <CardDescription>
                      {files.hasMore ? 'Sample data (more files available)' : 'Complete analysis'}
                    </CardDescription>
                  </div>
                  <ChevronDown className="h-4 w-4 transition-transform duration-200 data-[state=open]:rotate-180" />
                </CollapsibleTrigger>
              </CardHeader>
              <CollapsibleContent>
                <CardContent className="pt-2">
                  <div className="space-y-3">
                    <div className="grid gap-3">
                      <div className="flex justify-between rounded-lg border p-3">
                        <span className="font-medium">Total Files</span>
                        <span className="text-primary font-semibold">
                          {(files.totalFiles || 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between rounded-lg border p-3">
                        <span className="font-medium">Total Size</span>
                        <span className="text-primary font-semibold">
                          {formatFileSize(files.totalSizeBytes || 0)}
                        </span>
                      </div>
                    </div>

                    {/* File Categories - All 27 Categories with ScrollArea */}
                    {files.categories && (
                      <div className="space-y-2 border-t pt-3">
                        <h4 className="text-sm font-medium">
                          File Categories ({Object.keys(files.categories).length})
                        </h4>
                        <ScrollArea className="h-64">
                          <div className="grid gap-2 pr-3">
                            {Object.entries(files.categories || {})
                              .filter(([, count]) => count > 0)
                              .sort(([, a], [, b]) => b - a)
                              .map(([categoryId, count]) => {
                                const category = FILE_TYPE_CATEGORIES[categoryId]
                                if (!category) return null
                                const Icon = category.icon
                                return (
                                  <div
                                    key={categoryId}
                                    className="hover:bg-muted/30 flex items-center justify-between rounded-md border p-2 transition-colors"
                                  >
                                    <div className="flex min-w-0 flex-1 items-center gap-2 pr-2">
                                      <Icon className="text-muted-foreground h-4 w-4 shrink-0" />
                                      <span
                                        className="max-w-[120px] truncate text-sm sm:max-w-[150px]"
                                        title={category.label}
                                      >
                                        {category.label}
                                      </span>
                                    </div>
                                    <Badge variant="secondary" className="text-xs">
                                      {count.toLocaleString()}
                                    </Badge>
                                  </div>
                                )
                              })}
                          </div>
                        </ScrollArea>
                      </div>
                    )}
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>

          {/* Top File Types with Collapsible */}
          <Card>
            <Collapsible defaultOpen={true}>
              <CardHeader className="pb-2">
                <CollapsibleTrigger className="hover:bg-muted/50 -m-2 flex w-full items-center justify-between rounded-md p-2 transition-colors">
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Top File Types
                  </CardTitle>
                  <ChevronDown className="h-4 w-4 transition-transform duration-200 data-[state=open]:rotate-180" />
                </CollapsibleTrigger>
              </CardHeader>
              <CollapsibleContent>
                <CardContent className="pt-2">
                  <ScrollArea className="h-64">
                    <div className="space-y-3 pr-3">
                      {getTopFileTypes().map(
                        ({ type, count, size }: { type: string; count: number; size: number }) => (
                          <div
                            key={type}
                            className="hover:bg-muted/30 flex items-center justify-between rounded-lg border p-3 transition-colors"
                          >
                            <div className="min-w-0 flex-1 pr-2">
                              <p
                                className="max-w-[150px] truncate font-medium sm:max-w-[200px] md:max-w-[250px]"
                                title={type}
                              >
                                {type}
                              </p>
                              <p className="text-muted-foreground text-xs">
                                {count.toLocaleString()} files
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <span className="text-sm font-medium">{formatFileSize(size)}</span>
                              <Badge variant="secondary" className="text-xs">
                                {((size / (files?.totalSizeBytes || 1)) * 100).toFixed(1)}%
                              </Badge>
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        </div>
      )}

      {/* Largest Files with Collapsible */}
      {files?.largestFiles && files.largestFiles.length > 0 && (
        <Card>
          <Collapsible defaultOpen={true}>
            <CardHeader className="pb-2">
              <CollapsibleTrigger className="hover:bg-muted/50 -m-2 flex w-full items-center justify-between rounded-md p-2 transition-colors">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <HardDrive className="h-5 w-5" />
                    Largest Files
                  </CardTitle>
                  <CardDescription>
                    Top {files.largestFiles.length} largest files in your Drive
                  </CardDescription>
                </div>
                <ChevronDown className="h-4 w-4 transition-transform duration-200 data-[state=open]:rotate-180" />
              </CollapsibleTrigger>
            </CardHeader>
            <CollapsibleContent>
              <CardContent className="pt-2">
                <ScrollArea className="h-64">
                  <div className="space-y-2 pr-3">
                    {files.largestFiles.map((file, index) => (
                      <div
                        key={file.id}
                        className="hover:bg-muted/30 flex items-center justify-between rounded-lg border p-3 transition-colors"
                      >
                        <div className="min-w-0 flex-1 pr-2">
                          <p
                            className="max-w-[200px] truncate text-sm font-medium sm:max-w-[300px] md:max-w-[400px]"
                            title={file.name}
                          >
                            {file.name}
                          </p>
                          <p
                            className="text-muted-foreground max-w-[150px] truncate text-xs sm:max-w-[200px]"
                            title={file.mimeType}
                          >
                            {file.mimeType.split('/')[1] || 'unknown'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{formatFileSize(file.size)}</span>
                          <Badge variant="secondary">#{index + 1}</Badge>
                          {file.webViewLink && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 px-2 text-xs"
                              onClick={() => window.open(file.webViewLink, '_blank')}
                            >
                              View
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      )}

      {/* Debug Info for Duplicate Detection */}
      {files && (
        <Card className="border-amber-200 bg-amber-50/50">
          <Collapsible defaultOpen={false}>
            <CardHeader className="pb-2">
              <CollapsibleTrigger className="hover:bg-muted/50 -m-2 flex w-full items-center justify-between rounded-md p-2 transition-colors">
                <div>
                  <CardTitle className="flex items-center gap-2 text-amber-800">
                    <RefreshCw className="h-5 w-5" />
                    Debug Info
                  </CardTitle>
                  <CardDescription className="text-amber-700">
                    Debug information for duplicate detection
                  </CardDescription>
                </div>
                <ChevronDown className="h-4 w-4 transition-transform duration-200 data-[state=open]:rotate-180" />
              </CollapsibleTrigger>
            </CardHeader>
            <CollapsibleContent>
              <CardContent className="pt-2">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Duplicate Files Array:</span>
                    <span className="font-mono">
                      {files.duplicateFiles ? `${files.duplicateFiles.length} groups` : 'undefined'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Files:</span>
                    <span className="font-mono">{files.totalFiles || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Has More:</span>
                    <span className="font-mono">{files.hasMore ? 'true' : 'false'}</span>
                  </div>
                  {files.duplicateFiles && (
                    <div className="mt-3 rounded bg-amber-100 p-2 font-mono text-xs">
                      <pre>{JSON.stringify(files.duplicateFiles, null, 2)}</pre>
                    </div>
                  )}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      )}

      {/* Duplicate Files Detection - Enhanced with Better Fallback */}
      {files && (
        <Card
          className={
            files.duplicateFiles && files.duplicateFiles.length > 0
              ? ''
              : 'border-slate-200 bg-slate-50/50'
          }
        >
          <Collapsible defaultOpen={files.duplicateFiles && files.duplicateFiles.length > 0}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CollapsibleTrigger className="hover:bg-muted/50 -m-2 flex flex-1 items-center justify-between rounded-md p-2 transition-colors">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Copy className="h-5 w-5" />
                      Duplicate Files
                      {files.duplicateFiles && files.duplicateFiles.length > 0 && (
                        <Badge variant="destructive" className="ml-2">
                          {files.duplicateFiles.length} groups
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      {files.duplicateFiles && files.duplicateFiles.length > 0 ? (
                        <>
                          Found {files.duplicateFiles.length} duplicate groups •
                          {files.duplicateFiles.reduce(
                            (total, group) => total + group.wastedSpace,
                            0,
                          ) > 0 && (
                            <span className="text-destructive ml-1">
                              {formatFileSize(
                                files.duplicateFiles.reduce(
                                  (total, group) => total + group.wastedSpace,
                                  0,
                                ),
                              )}{' '}
                              wasted space
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-muted-foreground">
                          No duplicate files detected or analysis in progress...
                        </span>
                      )}
                    </CardDescription>
                  </div>
                  <ChevronDown className="h-4 w-4 transition-transform duration-200 data-[state=open]:rotate-180" />
                </CollapsibleTrigger>
                
                {/* Bulk Action Button */}
                {files.duplicateFiles && files.duplicateFiles.length > 0 && (
                  <Button
                    size="sm"
                    variant="default"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDuplicateBulkAction()
                    }}
                    className="ml-2 gap-2"
                  >
                    <Copy className="h-4 w-4" />
                    Action
                  </Button>
                )}
              </div>
            </CardHeader>
            <CollapsibleContent>
              <CardContent className="pt-2">
                {files.duplicateFiles && files.duplicateFiles.length > 0 ? (
                  <ScrollArea className="h-96">
                    <div className="space-y-3 pr-3">
                      {files.duplicateFiles.map((duplicateGroup, groupIndex) => (
                        <Collapsible
                          key={`${duplicateGroup.type}-${duplicateGroup.identifier || groupIndex}`}
                          className="rounded-lg border"
                        >
                          <CollapsibleTrigger className="hover:bg-muted/50 flex w-full items-start justify-between gap-2 p-3 transition-colors sm:items-center">
                            <div className="flex items-center gap-3">
                              <ChevronRight className="h-4 w-4 transition-transform duration-200 [&[data-state=open]>svg]:rotate-90" />
                              <div className="min-w-0 flex-1 text-left">
                                <div className="flex flex-wrap items-center gap-2">
                                  <Badge variant="destructive" className="shrink-0 text-xs">
                                    {duplicateGroup.files.length} copies
                                  </Badge>
                                  <Badge
                                    variant={
                                      duplicateGroup.type === 'md5' ? 'default' : 'secondary'
                                    }
                                    className="shrink-0 text-xs"
                                  >
                                    {duplicateGroup.type === 'md5' ? 'Identical' : 'Same Name'}
                                  </Badge>
                                  <span
                                    className="max-w-[120px] truncate text-sm font-medium sm:max-w-[150px] md:max-w-[200px]"
                                    title={duplicateGroup.files[0]?.name || 'Unknown File'}
                                  >
                                    {duplicateGroup.files[0]?.name || 'Unknown File'}
                                  </span>
                                </div>
                                <p
                                  className="text-muted-foreground max-w-[200px] truncate text-xs sm:max-w-[250px]"
                                  title={`${duplicateGroup.files[0]?.mimeType || 'unknown'} • ${formatFileSize(duplicateGroup.files[0]?.size || 0)} each`}
                                >
                                  {duplicateGroup.files[0]?.mimeType.split('/')[1] || 'Unknown'} •
                                  {formatFileSize(duplicateGroup.files[0]?.size || 0)} each
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {formatFileSize(duplicateGroup.totalSize)} total
                              </Badge>
                              {duplicateGroup.wastedSpace > 0 && (
                                <Badge variant="destructive" className="text-xs">
                                  -{formatFileSize(duplicateGroup.wastedSpace)} wasted
                                </Badge>
                              )}
                            </div>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="border-t p-3">
                              <div className="space-y-2">
                                {duplicateGroup.files.map((file, fileIndex) => (
                                  <div
                                    key={file.id}
                                    className="bg-muted/30 hover:bg-muted/50 flex cursor-pointer items-center justify-between rounded-md p-2 transition-colors"
                                    onClick={() => {
                                      if (file.webViewLink) {
                                        window.open(
                                          file.webViewLink,
                                          '_blank',
                                          'noopener,noreferrer',
                                        )
                                      }
                                    }}
                                    title={
                                      file.webViewLink
                                        ? 'Click to open file in Google Drive'
                                        : 'File not accessible'
                                    }
                                  >
                                    <div className="min-w-0 flex-1 pr-2">
                                      <p
                                        className="max-w-[180px] truncate text-sm font-medium sm:max-w-[250px] md:max-w-[300px]"
                                        title={file.name}
                                      >
                                        {file.name}
                                      </p>
                                      <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-xs">
                                        <span className="max-w-[100px] truncate" title={file.id}>
                                          ID: {file.id.substring(0, 8)}...
                                        </span>
                                        {file.modifiedTime && (
                                          <span className="shrink-0">
                                            Modified:{' '}
                                            {new Date(file.modifiedTime).toLocaleDateString()}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Badge variant="secondary" className="text-xs">
                                        Copy #{fileIndex + 1}
                                      </Badge>
                                      {file.webViewLink && (
                                        <Badge variant="outline" className="text-xs">
                                          Click to open
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                              <div className="mt-3 border-t pt-2">
                                <div className="text-muted-foreground flex items-center justify-between text-xs">
                                  <span>
                                    {duplicateGroup.type === 'md5'
                                      ? `MD5: ${duplicateGroup.identifier.substring(0, 16)}...`
                                      : `Filename: ${duplicateGroup.identifier}`}
                                  </span>
                                  <span>
                                    {duplicateGroup.type === 'md5'
                                      ? `Keep 1 copy • Delete ${duplicateGroup.files.length - 1} to save ${formatFileSize(duplicateGroup.wastedSpace)}`
                                      : `Keep smallest • Save ${formatFileSize(duplicateGroup.wastedSpace)}`}
                                  </span>
                                </div>

    
                              </div>
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="py-8 text-center">
                    <Copy className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
                    <h3 className="mb-2 text-lg font-medium">No Duplicate Files Found</h3>
                    <p className="text-muted-foreground mb-4 text-sm">
                      Either your Drive is well-organized or the analysis is still running.
                    </p>
                    <div className="text-muted-foreground grid grid-cols-2 gap-4 text-xs">
                      <div className="text-left">
                        <p className="mb-1 font-medium">Possible reasons:</p>
                        <ul className="space-y-1">
                          <li>• No actual duplicate files</li>
                          <li>• Files lack MD5 checksums</li>
                          <li>• Analysis still in progress</li>
                        </ul>
                      </div>
                      <div className="text-left">
                        <p className="mb-1 font-medium">What gets detected:</p>
                        <ul className="space-y-1">
                          <li>• Identical file content</li>
                          <li>• Same MD5 hash</li>
                          <li>• Files with size {'>'} 0</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      )}

      {/* Duplicate Bulk Operations Dialog */}
      {files && files.duplicateFiles && (
        <DuplicateBulkOperationsDialog
          isOpen={isDuplicateBulkActionOpen}
          onClose={handleCloseDuplicateBulkAction}
          duplicateGroups={files.duplicateFiles}
        />
      )}
    </div>
  )
}
