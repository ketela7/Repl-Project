'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  AlertTriangle,
  BarChart3,
  Clock,
  Database,
  FileIcon,
  FileSpreadsheet,
  FileText,
  Gauge,
  HardDrive,
  Image,
  Presentation,
  RefreshCw,
  TrendingUp,
  Video,
  Zap,
} from 'lucide-react'

interface StorageData {
  quota: {
    limit: number | null
    used: number
    usedInDrive: number
    usedInDriveTrash: number
    available: number | null
    usagePercentage: number | null
    hasUnlimitedStorage: boolean
  }
  fileStats: {
    totalFiles: number
    totalSizeBytes: number
    filesByType: Record<string, number>
    fileSizesByType: Record<string, number>
    sharedFiles: number
    starredFiles: number
    trashedFiles: number
  }
  largestFiles: Array<{
    name: string
    size: number
    mimeType: string
    id: string
    webViewLink?: string
  }>
  systemCapabilities: {
    maxUploadSize: number | null
    canCreateDrives: boolean
    maxImportSizes: Record<string, number>
    importFormats: Record<string, string[]>
    exportFormats: Record<string, string[]>
    folderColorPalette: string[]
    driveThemes: any[]
    appInstalled: boolean
  }
  user: {
    displayName?: string
    emailAddress?: string
    photoLink?: string
    permissionId?: string
  }
  processing: {
    totalApiCalls: number
    processingTimeMs: number
    filesProcessed: number
    estimatedAccuracy: number
    totalProcessingTimeMs?: number
  }
}

interface AnalyticsMeta {
  strategy: 'fast' | 'complete' | 'progressive'
  performanceMs: number
  accuracy: number
  apiCallsUsed: number
  timestamp: string
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  return `${(ms / 60000).toFixed(1)}m`
}

function getFileTypeIcon(mimeType: string) {
  if (mimeType === 'application/vnd.google-apps.document') return FileText
  if (mimeType === 'application/vnd.google-apps.spreadsheet') return FileSpreadsheet
  if (mimeType === 'application/vnd.google-apps.presentation') return Presentation
  if (mimeType.startsWith('image/')) return Image
  if (mimeType.startsWith('video/')) return Video
  if (mimeType === 'application/pdf') return FileText
  return FileIcon
}

function QuotaOverview({ quota }: { quota: StorageData['quota'] }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Storage Quota</CardTitle>
        <HardDrive className="text-muted-foreground h-4 w-4" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {quota.hasUnlimitedStorage ? (
            <div>
              <div className="text-2xl font-bold">Unlimited</div>
              <p className="text-muted-foreground text-xs">No storage limits</p>
            </div>
          ) : (
            <div>
              <div className="text-2xl font-bold">{formatBytes(quota.used)}</div>
              <p className="text-muted-foreground text-xs">
                of {quota.limit ? formatBytes(quota.limit) : 'Unknown'} used
              </p>
              {quota.usagePercentage && <Progress value={quota.usagePercentage} className="mt-2" />}
            </div>
          )}

          <Separator />

          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Drive Storage:</span>
              <span className="font-medium">{formatBytes(quota.usedInDrive)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Trash:</span>
              <span className="font-medium">{formatBytes(quota.usedInDriveTrash)}</span>
            </div>
            {quota.available && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Available:</span>
                <span className="font-medium text-green-600">{formatBytes(quota.available)}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ProcessingStats({
  processing,
  meta,
}: {
  processing: ComprehensiveStorageData['processing']
  meta: AnalyticsMeta
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Analysis Performance</CardTitle>
        <Gauge className="text-muted-foreground h-4 w-4" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-lg font-bold">{meta.accuracy}%</div>
              <p className="text-muted-foreground text-xs">Accuracy</p>
            </div>
            <div>
              <div className="text-lg font-bold">{processing.filesProcessed.toLocaleString()}</div>
              <p className="text-muted-foreground text-xs">Files Analyzed</p>
            </div>
          </div>

          <Separator />

          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Strategy:</span>
              <Badge variant="outline" className="text-xs">
                {meta.strategy}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Processing Time:</span>
              <span className="font-medium">{formatDuration(meta.performanceMs)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">API Calls:</span>
              <span className="font-medium">{meta.apiCallsUsed}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Updated:</span>
              <span className="font-medium">{new Date(meta.timestamp).toLocaleTimeString()}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function StorageByTypeChart({ fileStats }: { fileStats: ComprehensiveStorageData['fileStats'] }) {
  const sizeTypes = [
    {
      name: 'Images',
      size: fileStats.fileSizesByType.images,
      icon: Image,
      color: 'text-purple-600',
    },
    { name: 'Videos', size: fileStats.fileSizesByType.videos, icon: Video, color: 'text-red-600' },
    { name: 'PDFs', size: fileStats.fileSizesByType.pdfs, icon: FileText, color: 'text-gray-600' },
    {
      name: 'Other',
      size: fileStats.fileSizesByType.other,
      icon: FileIcon,
      color: 'text-gray-500',
    },
  ]

  const totalSize = fileStats.totalSizeBytes

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Storage by File Type</CardTitle>
        <BarChart3 className="text-muted-foreground h-4 w-4" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-2xl font-bold">{formatBytes(totalSize)}</div>
          <p className="text-muted-foreground text-xs">Total Storage Used</p>

          <Separator />

          <div className="space-y-3">
            {sizeTypes.map(type => {
              const percentage = totalSize > 0 ? Math.round((type.size / totalSize) * 100) : 0
              const Icon = type.icon

              if (type.size === 0) return null

              return (
                <div key={type.name} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Icon className={`h-4 w-4 ${type.color}`} />
                      <span className="font-medium">{type.name}</span>
                    </div>
                    <span className="text-muted-foreground">{percentage}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <Progress value={percentage} className="mr-2 flex-1" />
                    <span className="min-w-[60px] text-right text-xs font-medium">{formatBytes(type.size)}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function LargestFilesList({ largestFiles }: { largestFiles: ComprehensiveStorageData['largestFiles'] }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Largest Files</CardTitle>
        <TrendingUp className="text-muted-foreground h-4 w-4" />
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px] px-6">
          <div className="space-y-2 py-4">
            {largestFiles.map((file, index) => {
              const Icon = getFileTypeIcon(file.mimeType)

              return (
                <div key={file.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <Icon className="text-muted-foreground h-4 w-4 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium" title={file.name}>
                        {file.name}
                      </p>
                      <p className="text-muted-foreground text-xs">{file.mimeType.split('/')[1]}</p>
                    </div>
                  </div>
                  <div className="ml-2 flex-shrink-0 text-right">
                    <p className="text-sm font-medium">{formatBytes(file.size)}</p>
                    <Badge variant="secondary" className="text-xs">
                      #{index + 1}
                    </Badge>
                  </div>
                </div>
              )
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

export function EnhancedStorageAnalytics() {
  const [data, setData] = useState<ComprehensiveStorageData | null>(null)
  const [meta, setMeta] = useState<AnalyticsMeta | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [strategy, setStrategy] = useState<'fast' | 'complete' | 'progressive'>('progressive')

  const fetchStorageData = async (selectedStrategy: 'fast' | 'complete' | 'progressive' = strategy) => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/drive/storage/comprehensive?strategy=${selectedStrategy}`)
      const result = await response.json()

      if (result.success) {
        setData(result.data)
        setMeta(result.meta)
      } else {
        setError(result.error || 'Failed to fetch storage data')
      }
    } catch (err: any) {
      setError(err.message || 'Network error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStorageData()
  }, [])

  const handleStrategyChange = (newStrategy: 'fast' | 'complete' | 'progressive') => {
    setStrategy(newStrategy)
    fetchStorageData(newStrategy)
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="space-y-4 text-center">
          <RefreshCw className="text-muted-foreground mx-auto h-8 w-8 animate-spin" />
          <div>
            <p className="font-medium">Analyzing your Drive storage...</p>
            <p className="text-muted-foreground text-sm">
              {strategy === 'complete' ? 'This may take a while for large drives' : 'Processing files...'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex min-h-[400px] items-center justify-center">
          <div className="space-y-4 text-center">
            <AlertTriangle className="text-destructive mx-auto h-12 w-12" />
            <div>
              <h3 className="mb-2 text-lg font-semibold">Analysis Failed</h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={() => fetchStorageData()}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data || !meta) {
    return (
      <Card>
        <CardContent className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground">No storage data available</p>
            <Button onClick={() => fetchStorageData()} className="mt-4">
              Analyze Storage
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Strategy Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Analysis Strategy
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button
              variant={strategy === 'fast' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleStrategyChange('fast')}
              disabled={loading}
            >
              <Clock className="mr-2 h-4 w-4" />
              Fast (~2k files)
            </Button>
            <Button
              variant={strategy === 'progressive' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleStrategyChange('progressive')}
              disabled={loading}
            >
              <Gauge className="mr-2 h-4 w-4" />
              Progressive (Smart)
            </Button>
            <Button
              variant={strategy === 'complete' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleStrategyChange('complete')}
              disabled={loading}
            >
              <Database className="mr-2 h-4 w-4" />
              Complete (All files)
            </Button>
          </div>
          <p className="text-muted-foreground mt-2 text-xs">
            Current: {meta.accuracy}% accuracy • {data.processing.filesProcessed.toLocaleString()} files analyzed •{' '}
            {formatDuration(meta.performanceMs)}
          </p>
        </CardContent>
      </Card>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <QuotaOverview quota={data.quota} />
        <ProcessingStats processing={data.processing} meta={meta} />
        <StorageByTypeChart fileStats={data.fileStats} />
      </div>

      {/* Detailed Analysis */}
      <Tabs defaultValue="largest-files" className="space-y-4">
        <TabsList>
          <TabsTrigger value="largest-files">Largest Files</TabsTrigger>
          <TabsTrigger value="file-types">File Types</TabsTrigger>
          <TabsTrigger value="system-info">System Info</TabsTrigger>
        </TabsList>

        <TabsContent value="largest-files">
          <LargestFilesList largestFiles={data.largestFiles} />
        </TabsContent>

        <TabsContent value="file-types">
          <Card>
            <CardHeader>
              <CardTitle>File Type Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {Object.entries(data.fileStats.filesByType).map(([type, count]) => (
                  <div key={type} className="rounded-lg border p-4 text-center">
                    <div className="text-2xl font-bold">{count.toLocaleString()}</div>
                    <div className="text-muted-foreground text-sm capitalize">{type}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system-info">
          <Card>
            <CardHeader>
              <CardTitle>System Capabilities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <h4 className="mb-2 font-medium">Upload Limits</h4>
                    <p className="text-sm">
                      Max Upload:{' '}
                      {data.systemCapabilities.maxUploadSize
                        ? formatBytes(data.systemCapabilities.maxUploadSize)
                        : 'No limit'}
                    </p>
                  </div>
                  <div>
                    <h4 className="mb-2 font-medium">Account Info</h4>
                    <p className="text-sm">
                      {data.user.displayName} ({data.user.emailAddress})
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
