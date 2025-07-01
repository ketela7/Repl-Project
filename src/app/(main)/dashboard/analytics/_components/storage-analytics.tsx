'use client'

import { useState, useEffect } from 'react'
import {
  BarChart3,
  HardDrive,
  FileText,
  Image,
  Video,
  FileSpreadsheet,
  Presentation,
  FileIcon,
  Users,
  Star,
  Trash2,
  RefreshCw,
  TrendingUp,
  Pie,
  Database,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'

interface StorageQuota {
  limit: number | null
  used: number
  usedInDrive: number
  usedInDriveTrash: number
  available: number | null
  usagePercentage: number | null
}

interface FileStats {
  totalFiles: number
  totalSizeBytes: number
  filesByType: {
    documents: number
    spreadsheets: number
    presentations: number
    images: number
    videos: number
    pdfs: number
    other: number
  }
  fileSizesByType: {
    images: number
    videos: number
    pdfs: number
    other: number
  }
  sharedFiles: number
  starredFiles: number
}

interface LargestFile {
  name: string
  size: number
  mimeType: string
}

interface StorageAnalyticsData {
  quota: StorageQuota
  fileStats: FileStats
  largestFiles: LargestFile[]
  user: {
    displayName?: string
    emailAddress?: string
    photoLink?: string
  }
  lastUpdated: string
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'

  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`
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

function StorageQuotaCard({ quota }: { quota: StorageQuota }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Storage Usage</CardTitle>
        <HardDrive className="text-muted-foreground h-4 w-4" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between text-sm">
              <span>Used in Drive</span>
              <span className="font-medium">
                {formatBytes(quota.usedInDrive)}
                {quota.limit && ` / ${formatBytes(quota.limit)}`}
              </span>
            </div>
            {quota.usagePercentage !== null && <Progress value={quota.usagePercentage} className="mt-2" />}
          </div>

          {quota.limit && (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Available</p>
                <p className="font-medium text-green-600">{quota.available ? formatBytes(quota.available) : 'N/A'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Usage</p>
                <p className="font-medium">{quota.usagePercentage}%</p>
              </div>
            </div>
          )}

          {quota.usedInDriveTrash > 0 && (
            <div className="flex items-center justify-between border-t pt-2 text-sm">
              <span className="text-muted-foreground flex items-center gap-1">
                <Trash2 className="h-3 w-3" />
                In Trash
              </span>
              <span className="text-red-600">{formatBytes(quota.usedInDriveTrash)}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function FileStatsCard({ fileStats }: { fileStats: FileStats }) {
  const totalFiles = fileStats.totalFiles
  const fileTypes = [
    {
      name: 'Documents',
      count: fileStats.filesByType.documents,
      icon: FileText,
      color: 'text-blue-600',
    },
    {
      name: 'Spreadsheets',
      count: fileStats.filesByType.spreadsheets,
      icon: FileSpreadsheet,
      color: 'text-green-600',
    },
    {
      name: 'Presentations',
      count: fileStats.filesByType.presentations,
      icon: Presentation,
      color: 'text-orange-600',
    },
    { name: 'Images', count: fileStats.filesByType.images, icon: Image, color: 'text-purple-600' },
    { name: 'Videos', count: fileStats.filesByType.videos, icon: Video, color: 'text-red-600' },
    { name: 'PDFs', count: fileStats.filesByType.pdfs, icon: FileText, color: 'text-gray-600' },
    { name: 'Other', count: fileStats.filesByType.other, icon: FileIcon, color: 'text-gray-500' },
  ]

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">File Distribution</CardTitle>
        <Pie className="text-muted-foreground h-4 w-4" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-2xl font-bold">{totalFiles.toLocaleString()}</div>
          <p className="text-muted-foreground text-xs">Total Files</p>

          <Separator />

          <div className="space-y-2">
            {fileTypes.map(type => {
              const percentage = totalFiles > 0 ? Math.round((type.count / totalFiles) * 100) : 0
              const Icon = type.icon

              return (
                <div key={type.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${type.color}`} />
                    <span className="text-sm">{type.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{type.count}</div>
                    <div className="text-muted-foreground text-xs">{percentage}%</div>
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

function StorageSizeCard({ fileStats }: { fileStats: FileStats }) {
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
        <CardTitle className="text-sm font-medium">Storage by Type</CardTitle>
        <Database className="text-muted-foreground h-4 w-4" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-2xl font-bold">{formatBytes(totalSize)}</div>
          <p className="text-muted-foreground text-xs">Total File Size</p>

          <Separator />

          <div className="space-y-2">
            {sizeTypes.map(type => {
              const percentage = totalSize > 0 ? Math.round((type.size / totalSize) * 100) : 0
              const Icon = type.icon

              if (type.size === 0) return null

              return (
                <div key={type.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${type.color}`} />
                    <span className="text-sm">{type.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{formatBytes(type.size)}</div>
                    <div className="text-muted-foreground text-xs">{percentage}%</div>
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

function ActivityCard({ fileStats }: { fileStats: FileStats }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">File Activity</CardTitle>
        <TrendingUp className="text-muted-foreground h-4 w-4" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              <span className="text-sm">Shared Files</span>
            </div>
            <Badge variant="secondary">{fileStats.sharedFiles}</Badge>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-600" />
              <span className="text-sm">Starred Files</span>
            </div>
            <Badge variant="secondary">{fileStats.starredFiles}</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function LargestFilesCard({ largestFiles }: { largestFiles: LargestFile[] }) {
  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Largest Files
        </CardTitle>
        <CardDescription>Files taking up the most storage space</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-80">
          <div className="space-y-2">
            {largestFiles.map((file, index) => {
              const Icon = getFileTypeIcon(file.mimeType)

              return (
                <div key={index} className="flex items-center justify-between rounded-lg border p-2">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <Icon className="text-muted-foreground h-4 w-4 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium" title={file.name}>
                        {file.name}
                      </p>
                      <p className="text-muted-foreground text-xs">{file.mimeType}</p>
                    </div>
                  </div>
                  <div className="ml-2 flex-shrink-0 text-right">
                    <p className="text-sm font-medium">{formatBytes(file.size)}</p>
                    <Badge variant="outline" className="text-xs">
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

export function StorageAnalytics() {
  const [data, setData] = useState<StorageAnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStorageData = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/drive/storage')
      const result = await response.json()

      if (result.success) {
        setData(result.data)
      } else {
        setError(result.error || 'Failed to fetch storage data')
      }
    } catch (err) {
      setError('Failed to load storage analytics')
      console.error('Storage analytics error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStorageData()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="mb-2 h-8 w-16" />
                <Skeleton className="mb-4 h-2 w-full" />
                <div className="space-y-2">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={fetchStorageData} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="text-muted-foreground">No storage data available</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with refresh button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          <h2 className="text-lg font-semibold">Storage Overview</h2>
        </div>
        <Button onClick={fetchStorageData} variant="outline" size="sm">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Storage overview cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StorageQuotaCard quota={data.quota} />
        <FileStatsCard fileStats={data.fileStats} />
        <StorageSizeCard fileStats={data.fileStats} />
        <ActivityCard fileStats={data.fileStats} />
      </div>

      {/* Largest files */}
      <LargestFilesCard largestFiles={data.largestFiles} />

      {/* Last updated */}
      <div className="text-muted-foreground text-center text-xs">
        Last updated: {new Date(data.lastUpdated).toLocaleString()}
      </div>
    </div>
  )
}
