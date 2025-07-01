'use client'

import { useState, useEffect, useRef } from 'react'
import {
  FileText,
  Folder,
  Calendar,
  User,
  Share2,
  Download,
  Eye,
  Star,
  Shield,
  Globe,
  Lock,
  Users,
  Copy,
  Loader2,
  AlertCircle,
  Camera,
  Video,
  MapPin,
  Database,
  Palette,
  Monitor,
  Server,
  Tag,
  Fingerprint,
  Link,
  Archive,
} from 'lucide-react'
import { toast } from 'sonner'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { DriveFile } from '@/lib/google-drive/types'
import { formatFileSize } from '@/lib/google-drive/utils'
import { formatFileTime, formatCreationTime } from '@/lib/utils'
import { FileIcon } from '@/components/file-icon'
import { getInitials } from '@/lib/utils'

// Global cache and request tracking for file details
const fileDetailsCache = new Map<string, DetailedFileInfo>()
const activeFileDetailRequests = new Set<string>()
const pendingFileDetailPromises = new Map<string, Promise<DetailedFileInfo>>()

interface FileDetailsDialogProps {
  isOpen: boolean
  onClose: () => void
  fileId: string
  fileName: string
  fileType: 'file' | 'folder'
}

interface DetailedFileInfo extends DriveFile {
  description?: string
  lastModifyingUser?: {
    displayName: string
    emailAddress: string
    photoLink?: string
  }
  sharingUser?: {
    displayName: string
    emailAddress: string
    photoLink?: string
  }
  version?: string
  md5Checksum?: string
  sha1Checksum?: string
  sha256Checksum?: string
  quotaBytesUsed?: string
  starred?: boolean
  viewed?: boolean
  explicitlyTrashed?: boolean
  folderColorRgb?: string
  fullFileExtension?: string
  fileExtension?: string
  originalFilename?: string
  headRevisionId?: string
  isAppAuthorized?: boolean
  copyRequiresWriterPermission?: boolean
  writersCanShare?: boolean
  hasAugmentedPermissions?: boolean
  ownedByMe?: boolean
  driveId?: string
  teamDriveId?: string
  spaces?: string[]
  properties?: Record<string, string>
  appProperties?: Record<string, string>
  imageMediaMetadata?: {
    width?: number
    height?: number
    rotation?: number
    location?: {
      latitude?: number
      longitude?: number
      altitude?: number
    }
    time?: string
    cameraMake?: string
    cameraModel?: string
    exposureTime?: number
    aperture?: number
    flashUsed?: boolean
    focalLength?: number
    isoSpeed?: number
    meteringMode?: string
    sensor?: string
    exposureMode?: string
    colorSpace?: string
    whiteBalance?: string
    exposureBias?: number
    maxApertureValue?: number
    subjectDistance?: number
    lens?: string
  }
  videoMediaMetadata?: {
    width?: number
    height?: number
    durationMillis?: string
  }
  exportLinks?: Record<string, string>
  shortcutDetails?: {
    targetId?: string
    targetMimeType?: string
    targetResourceKey?: string
  }
  contentRestrictions?: Array<{
    readOnly?: boolean
    reason?: string
    restrictingUser?: {
      displayName: string
      emailAddress: string
      photoLink?: string
    }
    restrictionTime?: string
    type?: string
  }>
  resourceKey?: string
  linkShareMetadata?: {
    securityUpdateEligible?: boolean
    securityUpdateEnabled?: boolean
  }
  labelInfo?: {
    labels?: Array<{
      id?: string
      revisionId?: string
      kind?: string
      fields?: Record<string, any>
    }>
  }
  capabilities?: Record<string, boolean>
}

export function FileDetailsDialog({ isOpen, onClose, fileId, fileName, fileType }: FileDetailsDialogProps) {
  const [fileDetails, setFileDetails] = useState<DetailedFileInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const currentFileIdRef = useRef<string>('')

  useEffect(() => {
    if (isOpen && fileId) {
      currentFileIdRef.current = fileId
      fetchFileDetails()
    }

    // Cleanup on close or fileId change
    return () => {
      if (currentFileIdRef.current && currentFileIdRef.current !== fileId) {
        // Clean up any pending requests for the previous file
        activeFileDetailRequests.delete(currentFileIdRef.current)
        pendingFileDetailPromises.delete(currentFileIdRef.current)
      }
    }
  }, [isOpen, fileId])

  const fetchFileDetails = async () => {
    if (!fileId) return

    setLoading(true)
    setError(null)

    try {
      // Check cache first
      const cachedDetails = fileDetailsCache.get(fileId)
      if (cachedDetails) {
        setFileDetails(cachedDetails)
        setLoading(false)
        return
      }

      // Check if request is already pending
      const pendingPromise = pendingFileDetailPromises.get(fileId)
      if (pendingPromise) {
        const details = await pendingPromise
        setFileDetails(details)
        setLoading(false)
        return
      }

      // Check if request is already active
      if (activeFileDetailRequests.has(fileId)) {
        setLoading(false)
        return
      }

      // Mark request as active and create promise
      activeFileDetailRequests.add(fileId)

      const fetchPromise = (async (): Promise<DetailedFileInfo> => {
        const response = await fetch('/api/drive/files/details', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileId }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to fetch file details')
        }

        const result = await response.json()
        const details = result.fileDetails

        // Cache the result with 5-minute TTL
        fileDetailsCache.set(fileId, details)
        setTimeout(
          () => {
            fileDetailsCache.delete(fileId)
          },
          5 * 60 * 1000,
        )

        return details
      })()

      // Store pending promise for deduplication
      pendingFileDetailPromises.set(fileId, fetchPromise)

      const details = await fetchPromise
      setFileDetails(details)
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
      }
      setError(error instanceof Error ? error.message : 'Failed to fetch file details')
      toast.error('Failed to load file details')
    } finally {
      // Cleanup request tracking
      activeFileDetailRequests.delete(fileId)
      pendingFileDetailPromises.delete(fileId)
      setLoading(false)
    }
  }

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(`${label} copied to clipboard`)
    } catch (error) {
      toast.error('Failed to copy to clipboard')
    }
  }

  const renderPermissions = () => {
    if (!fileDetails?.permissions || fileDetails.permissions.length === 0) {
      return <span className="text-muted-foreground text-sm">Private</span>
    }

    const permissionCount = fileDetails.permissions.length
    const hasPublicAccess = fileDetails.permissions.some(p => p.type === 'anyone')

    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          {hasPublicAccess ? <Globe className="h-4 w-4" /> : <Users className="h-4 w-4" />}
          <span className="text-sm">
            {hasPublicAccess
              ? 'Public'
              : `Shared with ${permissionCount} ${permissionCount === 1 ? 'person' : 'people'}`}
          </span>
        </div>
        {fileDetails.shared && (
          <Badge variant="secondary" className="text-xs">
            Shared
          </Badge>
        )}
      </div>
    )
  }

  const renderCapabilities = () => {
    if (!fileDetails?.capabilities) return null

    const capabilities = fileDetails.capabilities

    const allCapabilities = Object.entries(capabilities).filter(([_key, value]) => value === true)
    const deniedCapabilities = Object.entries(capabilities).filter(([_key, value]) => value === false)

    // Group capabilities by category for better organization
    const groupCapabilities = (caps: [string, boolean][]) => {
      const groups = {
        'File Operations': [] as string[],
        'Content Management': [] as string[],
        'Sharing & Permissions': [] as string[],
        'Organization': [] as string[],
        'Drive Management': [] as string[],
        'Other': [] as string[]
      }

      caps.forEach(([key]) => {
        const cleanKey = (key as string)
          .replace('can', '')
          .replace(/([A-Z])/g, ' $1')
          .trim()

        if (key.includes('Edit') || key.includes('Delete') || key.includes('Copy') || key.includes('Download') || key.includes('Rename')) {
          groups['File Operations'].push(cleanKey)
        } else if (key.includes('Content') || key.includes('Comment') || key.includes('ModifyContent')) {
          groups['Content Management'].push(cleanKey)
        } else if (key.includes('Share') || key.includes('Permission') || key.includes('Owner')) {
          groups['Sharing & Permissions'].push(cleanKey)
        } else if (key.includes('Move') || key.includes('Parent') || key.includes('Children') || key.includes('Trash')) {
          groups['Organization'].push(cleanKey)
        } else if (key.includes('Drive') || key.includes('TeamDrive')) {
          groups['Drive Management'].push(cleanKey)
        } else {
          groups['Other'].push(cleanKey)
        }
      })

      return groups
    }

    const allowedGroups = groupCapabilities(allCapabilities)
    const restrictedGroups = groupCapabilities(deniedCapabilities)

    const renderCapabilityGroup = (groupName: string, capabilities: string[], isAllowed: boolean) => {
      if (capabilities.length === 0) return null

      const colorClasses = isAllowed 
        ? 'border-green-200 text-green-700 bg-green-50' 
        : 'border-red-200 text-red-700 bg-red-50'

      return (
        <div key={groupName} className="space-y-2">
          <h5 className={`text-xs font-medium ${isAllowed ? 'text-green-600' : 'text-red-600'}`}>
            {groupName} ({capabilities.length})
          </h5>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1">
            {capabilities.map((capability) => (
              <Badge 
                key={capability} 
                variant="outline" 
                className={`text-xs justify-start ${colorClasses}`}
              >
                {capability}
              </Badge>
            ))}
          </div>
        </div>
      )
    }

    return (
      <div className="space-y-4">
        {allCapabilities.length > 0 && (
          <div className="space-y-3">
            <h4 className="flex items-center gap-2 text-sm font-medium text-green-600">
              <Shield className="h-4 w-4" />
              Allowed Capabilities ({allCapabilities.length})
            </h4>
            <div className="space-y-3 pl-4">
              {Object.entries(allowedGroups).map(([groupName, capabilities]) => 
                renderCapabilityGroup(groupName, capabilities, true)
              )}
            </div>
          </div>
        )}

        {deniedCapabilities.length > 0 && (
          <div className="space-y-3">
            <h4 className="flex items-center gap-2 text-sm font-medium text-red-600">
              <Lock className="h-4 w-4" />
              Restricted Capabilities ({deniedCapabilities.length})
            </h4>
            <div className="space-y-3 pl-4">
              {Object.entries(restrictedGroups).map(([groupName, capabilities]) => 
                renderCapabilityGroup(groupName, capabilities, false)
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  const renderImageMetadata = () => {
    if (!fileDetails?.imageMediaMetadata) return null

    const meta = fileDetails.imageMediaMetadata

    return (
      <section>
        <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold">
          <Camera className="h-5 w-5" />
          Image Metadata
        </h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            {meta.width && meta.height && (
              <div className="flex items-center justify-between">
                <span className="font-medium">Dimensions:</span>
                <span className="text-sm">
                  {meta.width} × {meta.height} pixels
                </span>
              </div>
            )}
            {meta.rotation && (
              <div className="flex items-center justify-between">
                <span className="font-medium">Rotation:</span>
                <span className="text-sm">{meta.rotation}°</span>
              </div>
            )}
            {meta.cameraMake && (
              <div className="flex items-center justify-between">
                <span className="font-medium">Camera Make:</span>
                <span className="text-sm">{meta.cameraMake}</span>
              </div>
            )}
            {meta.cameraModel && (
              <div className="flex items-center justify-between">
                <span className="font-medium">Camera Model:</span>
                <span className="text-sm">{meta.cameraModel}</span>
              </div>
            )}
            {meta.lens && (
              <div className="flex items-center justify-between">
                <span className="font-medium">Lens:</span>
                <span className="text-sm">{meta.lens}</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            {meta.exposureTime && (
              <div className="flex items-center justify-between">
                <span className="font-medium">Exposure Time:</span>
                <span className="text-sm">1/{Math.round(1 / meta.exposureTime)}s</span>
              </div>
            )}
            {meta.aperture && (
              <div className="flex items-center justify-between">
                <span className="font-medium">Aperture:</span>
                <span className="text-sm">f/{meta.aperture}</span>
              </div>
            )}
            {meta.isoSpeed && (
              <div className="flex items-center justify-between">
                <span className="font-medium">ISO Speed:</span>
                <span className="text-sm">ISO {meta.isoSpeed}</span>
              </div>
            )}
            {meta.focalLength && (
              <div className="flex items-center justify-between">
                <span className="font-medium">Focal Length:</span>
                <span className="text-sm">{meta.focalLength}mm</span>
              </div>
            )}
            {meta.flashUsed !== undefined && (
              <div className="flex items-center justify-between">
                <span className="font-medium">Flash:</span>
                <Badge variant={meta.flashUsed ? 'default' : 'secondary'}>{meta.flashUsed ? 'Used' : 'Not Used'}</Badge>
              </div>
            )}
          </div>
        </div>

        {meta.location && (meta.location.latitude || meta.location.longitude) && (
          <div className="mt-4">
            <h4 className="mb-2 flex items-center gap-2 text-sm font-medium">
              <MapPin className="h-4 w-4" />
              Location Information
            </h4>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
              {meta.location.latitude && (
                <div className="flex items-center justify-between">
                  <span className="font-medium">Latitude:</span>
                  <span className="text-sm">{meta.location.latitude.toFixed(6)}</span>
                </div>
              )}
              {meta.location.longitude && (
                <div className="flex items-center justify-between">
                  <span className="font-medium">Longitude:</span>
                  <span className="text-sm">{meta.location.longitude.toFixed(6)}</span>
                </div>
              )}
              {meta.location.altitude && (
                <div className="flex items-center justify-between">
                  <span className="font-medium">Altitude:</span>
                  <span className="text-sm">{meta.location.altitude.toFixed(2)}m</span>
                </div>
              )}
            </div>
          </div>
        )}

        {(meta.colorSpace || meta.whiteBalance || meta.exposureMode) && (
          <div className="mt-4">
            <h4 className="mb-2 flex items-center gap-2 text-sm font-medium">
              <Palette className="h-4 w-4" />
              Color & Technical Settings
            </h4>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
              {meta.colorSpace && (
                <div className="flex items-center justify-between">
                  <span className="font-medium">Color Space:</span>
                  <span className="text-sm">{meta.colorSpace}</span>
                </div>
              )}
              {meta.whiteBalance && (
                <div className="flex items-center justify-between">
                  <span className="font-medium">White Balance:</span>
                  <span className="text-sm">{meta.whiteBalance}</span>
                </div>
              )}
              {meta.exposureMode && (
                <div className="flex items-center justify-between">
                  <span className="font-medium">Exposure Mode:</span>
                  <span className="text-sm">{meta.exposureMode}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </section>
    )
  }

  const renderVideoMetadata = () => {
    if (!fileDetails?.videoMediaMetadata) return null

    const meta = fileDetails.videoMediaMetadata
    const duration = meta.durationMillis ? parseInt(meta.durationMillis) : null

    return (
      <section>
        <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold">
          <Video className="h-5 w-5" />
          Video Metadata
        </h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {meta.width && meta.height && (
            <div className="flex items-center justify-between">
              <span className="font-medium">Resolution:</span>
              <span className="text-sm">
                {meta.width} × {meta.height} pixels
              </span>
            </div>
          )}
          {duration && (
            <div className="flex items-center justify-between">
              <span className="font-medium">Duration:</span>
              <span className="text-sm">
                {Math.floor(duration / 60000)}m {Math.floor((duration % 60000) / 1000)}s
              </span>
            </div>
          )}
          {meta.width && meta.height && (
            <div className="flex items-center justify-between">
              <span className="font-medium">Aspect Ratio:</span>
              <span className="text-sm">{(meta.width / meta.height).toFixed(2)}:1</span>
            </div>
          )}
        </div>
      </section>
    )
  }

  const renderTechnicalDetails = () => {
    return (
      <section>
        <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold">
          <Database className="h-5 w-5" />
          Technical Details
        </h3>
        <div className="space-y-4">
          {/* File Extensions */}
          {(fileDetails?.fileExtension || fileDetails?.fullFileExtension) && (
            <div>
              <h4 className="mb-2 text-sm font-medium">File Extensions</h4>
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                {fileDetails.fileExtension && (
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Extension:</span>
                    <Badge variant="outline">.{fileDetails.fileExtension}</Badge>
                  </div>
                )}
                {fileDetails.fullFileExtension && (
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Full Extension:</span>
                    <Badge variant="outline">.{fileDetails.fullFileExtension}</Badge>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Checksums */}
          <div>
            <h4 className="mb-2 flex items-center gap-2 text-sm font-medium">
              <Fingerprint className="h-4 w-4" />
              Checksums & Integrity
            </h4>
            <div className="space-y-2">
              {fileDetails?.md5Checksum && (
                <div className="flex items-center justify-between">
                  <span className="font-medium">MD5:</span>
                  <div className="flex items-center gap-2">
                    <span className="max-w-48 truncate font-mono text-xs">{fileDetails.md5Checksum}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(fileDetails.md5Checksum!, 'MD5 Checksum')}
                      className="h-6 w-6 p-0"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
              {fileDetails?.sha1Checksum && (
                <div className="flex items-center justify-between">
                  <span className="font-medium">SHA1:</span>
                  <div className="flex items-center gap-2">
                    <span className="max-w-48 truncate font-mono text-xs">{fileDetails.sha1Checksum}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(fileDetails.sha1Checksum!, 'SHA1 Checksum')}
                      className="h-6 w-6 p-0"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
              {fileDetails?.sha256Checksum && (
                <div className="flex items-center justify-between">
                  <span className="font-medium">SHA256:</span>
                  <div className="flex items-center gap-2">
                    <span className="max-w-48 truncate font-mono text-xs">{fileDetails.sha256Checksum}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(fileDetails.sha256Checksum!, 'SHA256 Checksum')}
                      className="h-6 w-6 p-0"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* System Information */}
          <div>
            <h4 className="mb-2 flex items-center gap-2 text-sm font-medium">
              <Server className="h-4 w-4" />
              System Information
            </h4>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              {fileDetails?.version && (
                <div className="flex items-center justify-between">
                  <span className="font-medium">Version:</span>
                  <span className="text-sm">{fileDetails.version}</span>
                </div>
              )}
              {fileDetails?.headRevisionId && (
                <div className="flex items-center justify-between">
                  <span className="font-medium">Revision ID:</span>
                  <span className="max-w-32 truncate font-mono text-xs">{fileDetails.headRevisionId}</span>
                </div>
              )}
              {fileDetails?.resourceKey && (
                <div className="flex items-center justify-between">
                  <span className="font-medium">Resource Key:</span>
                  <span className="max-w-32 truncate font-mono text-xs">{fileDetails.resourceKey}</span>
                </div>
              )}
              {fileDetails?.spaces && fileDetails.spaces.length > 0 && (
                <div className="flex items-center justify-between">
                  <span className="font-medium">Spaces:</span>
                  <div className="flex gap-1">
                    {fileDetails.spaces.map((space, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {space}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Drive Information */}
          {(fileDetails?.driveId || fileDetails?.teamDriveId) && (
            <div>
              <h4 className="mb-2 text-sm font-medium">Drive Information</h4>
              <div className="space-y-2">
                {fileDetails.driveId && (
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Drive ID:</span>
                    <span className="max-w-48 truncate font-mono text-xs">{fileDetails.driveId}</span>
                  </div>
                )}
                {fileDetails.teamDriveId && (
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Team Drive ID:</span>
                    <span className="max-w-48 truncate font-mono text-xs">{fileDetails.teamDriveId}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>
    )
  }

  const renderFileProperties = () => {
    const hasProperties =
      (fileDetails?.properties && Object.keys(fileDetails.properties).length > 0) ||
      (fileDetails?.appProperties && Object.keys(fileDetails.appProperties).length > 0)

    if (!hasProperties) return null

    return (
      <section>
        <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold">
          <Tag className="h-5 w-5" />
          Custom Properties
        </h3>

        {fileDetails?.properties && Object.keys(fileDetails.properties).length > 0 && (
          <div className="mb-4">
            <h4 className="mb-2 text-sm font-medium">User Properties</h4>
            <div className="space-y-2">
              {Object.entries(fileDetails.properties).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="font-medium">{key}:</span>
                  <span className="text-sm">{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {fileDetails?.appProperties && Object.keys(fileDetails.appProperties).length > 0 && (
          <div>
            <h4 className="mb-2 text-sm font-medium">App Properties</h4>
            <div className="space-y-2">
              {Object.entries(fileDetails.appProperties).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="font-medium">{key}:</span>
                  <span className="text-sm">{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    )
  }

  const renderExportLinks = () => {
    if (!fileDetails?.exportLinks || Object.keys(fileDetails.exportLinks).length === 0) return null

    return (
      <section>
        <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold">
          <Archive className="h-5 w-5" />
          Export Links
        </h3>
        <div className="space-y-2">
          {Object.entries(fileDetails.exportLinks).map(([format, link]) => (
            <div key={format} className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => window.open(link, '_blank')} className="flex-1">
                <Download className="mr-2 h-4 w-4" />
                Export as {format.split('/').pop()?.toUpperCase()}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(link, `${format} Export Link`)}
                className="h-9 w-9 p-0"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </section>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {fileType === 'folder' ? (
              <Folder className="h-5 w-5 text-blue-500" />
            ) : (
              <FileIcon mimeType={fileDetails?.mimeType || 'application/octet-stream'} className="h-5 w-5" />
            )}
            Details: {fileName}
          </DialogTitle>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading details...</span>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <span className="text-red-700">{error}</span>
          </div>
        )}

        {fileDetails && !loading && !error && (
          <div className="space-y-6">
            {/* Basic Information */}
            <section>
              <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold">
                <FileText className="h-5 w-5" />
                Basic Information
              </h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Name:</span>
                    <div className="flex items-center gap-2">
                      <span className="max-w-48 truncate text-sm">{fileDetails.name}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(fileDetails.name, 'File name')}
                        className="h-6 w-6 p-0"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Type:</span>
                    <Badge variant="secondary">
                      {fileDetails.mimeType?.split('/').pop()?.toUpperCase() || 'Unknown'}
                    </Badge>
                  </div>
                  {fileDetails.size && (
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Size:</span>
                      <span className="text-sm">{formatFileSize(parseInt(fileDetails.size))}</span>
                    </div>
                  )}
                  {fileDetails.quotaBytesUsed && (
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Storage Used:</span>
                      <span className="text-sm">{formatFileSize(parseInt(fileDetails.quotaBytesUsed))}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">ID:</span>
                    <div className="flex items-center gap-2">
                      <span className="max-w-32 truncate font-mono text-xs">{fileDetails.id}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(fileDetails.id, 'File ID')}
                        className="h-6 w-6 p-0"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  {fileDetails.version && (
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Version:</span>
                      <span className="text-sm">{fileDetails.version}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    {fileDetails.starred && (
                      <Badge variant="outline" className="border-yellow-300 text-yellow-600">
                        <Star className="mr-1 h-3 w-3 fill-current" />
                        Starred
                      </Badge>
                    )}
                    {fileDetails.viewed && (
                      <Badge variant="outline" className="border-blue-300 text-blue-600">
                        <Eye className="mr-1 h-3 w-3" />
                        Viewed
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {fileDetails.description && (
                <div className="mt-4">
                  <span className="font-medium">Description:</span>
                  <p className="text-muted-foreground bg-muted mt-1 rounded-lg p-3 text-sm">
                    {fileDetails.description}
                  </p>
                </div>
              )}
            </section>

            <Separator />

            {/* Dates and History */}
            <section>
              <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold">
                <Calendar className="h-5 w-5" />
                Dates & History
              </h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Created:</span>
                    <span className="text-sm">{formatCreationTime(fileDetails.createdTime)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Modified:</span>
                    <span className="text-sm">{formatFileTime(fileDetails.modifiedTime)}</span>
                  </div>
                </div>

                {fileDetails.lastModifyingUser && (
                  <div className="space-y-2">
                    <span className="font-medium">Last Modified By:</span>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={fileDetails.lastModifyingUser.photoLink} />
                        <AvatarFallback className="text-xs">
                          {getInitials(fileDetails.lastModifyingUser.displayName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{fileDetails.lastModifyingUser.displayName}</span>
                        <span className="text-muted-foreground text-xs">
                          {fileDetails.lastModifyingUser.emailAddress}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>

            <Separator />

            {/* Ownership and Sharing */}
            <section>
              <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold">
                <User className="h-5 w-5" />
                Ownership & Sharing
              </h3>

              {fileDetails.owners && fileDetails.owners.length > 0 && fileDetails.owners[0] && (
                <div className="mb-4">
                  <span className="font-medium">Owner:</span>
                  <div className="mt-2 flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={fileDetails.owners[0]?.photoLink} />
                      <AvatarFallback>{getInitials(fileDetails.owners[0]?.displayName || 'Unknown')}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{fileDetails.owners[0]?.displayName || 'Unknown'}</span>
                      <span className="text-muted-foreground text-xs">{fileDetails.owners[0]?.emailAddress || ''}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <span className="font-medium">Sharing Status:</span>
                {renderPermissions()}
              </div>
            </section>

            <Separator />

            {/* Security and Permissions */}
            <section>
              <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold">
                <Shield className="h-5 w-5" />
                Permissions & Security
              </h3>

              {fileDetails.md5Checksum && (
                <div className="mb-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">MD5 Checksum:</span>
                    <div className="flex items-center gap-2">
                      <span className="max-w-64 truncate font-mono text-xs">{fileDetails.md5Checksum}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(fileDetails.md5Checksum!, 'MD5 Checksum')}
                        className="h-6 w-6 p-0"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {renderCapabilities()}
            </section>

            <Separator />

            {/* Links and Actions */}
            <section>
              <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold">
                <Globe className="h-5 w-5" />
                Links & Actions
              </h3>
              <div className="space-y-3">
                {fileDetails.webViewLink && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(fileDetails.webViewLink, '_blank')}
                      className="flex-1"
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Open in Google Drive
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(fileDetails.webViewLink!, 'View Link')}
                      className="h-9 w-9 p-0"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                {fileDetails.webContentLink && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(fileDetails.webContentLink, '_blank')}
                      className="flex-1"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download Direct Link
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(fileDetails.webContentLink!, 'Download Link')}
                      className="h-9 w-9 p-0"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </section>

            {/* Image Metadata Section */}
            {fileDetails.imageMediaMetadata && (
              <>
                <Separator />
                {renderImageMetadata()}
              </>
            )}

            {/* Video Metadata Section */}
            {fileDetails.videoMediaMetadata && (
              <>
                <Separator />
                {renderVideoMetadata()}
              </>
            )}

            {/* Technical Details Section */}
            <Separator />
            {renderTechnicalDetails()}

            {/* File Properties Section */}
            {(fileDetails.properties && Object.keys(fileDetails.properties).length > 0) ||
            (fileDetails.appProperties && Object.keys(fileDetails.appProperties).length > 0) ? (
              <>
                <Separator />
                {renderFileProperties()}
              </>
            ) : null}

            {/* Export Links Section */}
            {fileDetails.exportLinks && Object.keys(fileDetails.exportLinks).length > 0 && (
              <>
                <Separator />
                {renderExportLinks()}
              </>
            )}

            {/* Extended Metadata Section */}
            <Separator />
            <section>
              <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold">
                <Monitor className="h-5 w-5" />
                Extended Metadata
              </h3>
              <div className="space-y-4">
                {/* File Status & Flags */}
                <div>
                  <h4 className="mb-2 text-sm font-medium">File Status</h4>
                  <div className="flex flex-wrap gap-2">
                    {fileDetails.ownedByMe && (
                      <Badge variant="outline" className="border-blue-200 text-blue-700">
                        <User className="mr-1 h-3 w-3" />
                        Owned by Me
                      </Badge>
                    )}
                    {fileDetails.starred && (
                      <Badge variant="outline" className="border-yellow-200 text-yellow-700">
                        <Star className="mr-1 h-3 w-3 fill-current" />
                        Starred
                      </Badge>
                    )}
                    {fileDetails.viewed && (
                      <Badge variant="outline" className="border-green-200 text-green-700">
                        <Eye className="mr-1 h-3 w-3" />
                        Viewed
                      </Badge>
                    )}
                    {fileDetails.shared && (
                      <Badge variant="outline" className="border-purple-200 text-purple-700">
                        <Share2 className="mr-1 h-3 w-3" />
                        Shared
                      </Badge>
                    )}
                    {fileDetails.explicitlyTrashed && (
                      <Badge variant="outline" className="border-red-200 text-red-700">
                        <AlertCircle className="mr-1 h-3 w-3" />
                        Explicitly Trashed
                      </Badge>
                    )}
                    {fileDetails.isAppAuthorized && (
                      <Badge variant="outline" className="border-green-200 text-green-700">
                        <Shield className="mr-1 h-3 w-3" />
                        App Authorized
                      </Badge>
                    )}
                  </div>
                </div>

                {/* File Restrictions */}
                <div>
                  <h4 className="mb-2 text-sm font-medium">File Restrictions</h4>
                  <div className="flex flex-wrap gap-2">
                    {fileDetails.copyRequiresWriterPermission && (
                      <Badge variant="outline" className="border-orange-200 text-orange-700">
                        <Lock className="mr-1 h-3 w-3" />
                        Copy Requires Writer Permission
                      </Badge>
                    )}
                    {fileDetails.writersCanShare !== undefined && (
                      <Badge
                        variant="outline"
                        className={
                          fileDetails.writersCanShare
                            ? 'border-green-200 text-green-700'
                            : 'border-red-200 text-red-700'
                        }
                      >
                        <Share2 className="mr-1 h-3 w-3" />
                        Writers {fileDetails.writersCanShare ? 'Can' : 'Cannot'} Share
                      </Badge>
                    )}
                    {fileDetails.hasAugmentedPermissions && (
                      <Badge variant="outline" className="border-blue-200 text-blue-700">
                        <Shield className="mr-1 h-3 w-3" />
                        Augmented Permissions
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Original File Information */}
                {(fileDetails.originalFilename || fileDetails.folderColorRgb) && (
                  <div>
                    <h4 className="mb-2 text-sm font-medium">Original File Information</h4>
                    <div className="space-y-2">
                      {fileDetails.originalFilename && (
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Original Filename:</span>
                          <span className="text-sm">{fileDetails.originalFilename}</span>
                        </div>
                      )}
                      {fileDetails.folderColorRgb && (
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Folder Color:</span>
                          <div className="flex items-center gap-2">
                            <div
                              className="h-4 w-4 rounded border"
                              style={{
                                backgroundColor: fileDetails.folderColorRgb,
                              }}
                            />
                            <span className="font-mono text-sm">{fileDetails.folderColorRgb}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Content Restrictions */}
                {fileDetails.contentRestrictions && fileDetails.contentRestrictions.length > 0 && (
                  <div>
                    <h4 className="mb-2 text-sm font-medium text-red-600">Content Restrictions</h4>
                    <div className="space-y-2">
                      {fileDetails.contentRestrictions.map((restriction, index) => (
                        <div key={index} className="rounded-lg border border-red-200 bg-red-50 p-3">
                          <div className="mb-2 flex items-center gap-2">
                            <Lock className="h-4 w-4 text-red-500" />
                            <span className="font-medium text-red-700">{restriction.type || 'Restriction'}</span>
                          </div>
                          {restriction.reason && <p className="mb-2 text-sm text-red-600">{restriction.reason}</p>}
                          {restriction.restrictingUser && (
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={restriction.restrictingUser.photoLink} />
                                <AvatarFallback className="text-xs">
                                  {getInitials(restriction.restrictingUser.displayName)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <span className="text-sm font-medium">{restriction.restrictingUser.displayName}</span>
                                <span className="text-muted-foreground ml-2 text-xs">
                                  {restriction.restrictingUser.emailAddress}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Shortcut Details */}
                {fileDetails.shortcutDetails && (
                  <div>
                    <h4 className="mb-2 flex items-center gap-2 text-sm font-medium">
                      <Link className="h-4 w-4" />
                      Shortcut Information
                    </h4>
                    <div className="space-y-2">
                      {fileDetails.shortcutDetails.targetId && (
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Target ID:</span>
                          <span className="font-mono text-xs">{fileDetails.shortcutDetails.targetId}</span>
                        </div>
                      )}
                      {fileDetails.shortcutDetails.targetMimeType && (
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Target Type:</span>
                          <Badge variant="outline">{fileDetails.shortcutDetails.targetMimeType}</Badge>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Link Share Metadata */}
                {fileDetails.linkShareMetadata && (
                  <div>
                    <h4 className="mb-2 text-sm font-medium">Link Share Security</h4>
                    <div className="space-y-2">
                      {fileDetails.linkShareMetadata.securityUpdateEligible !== undefined && (
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Security Update Eligible:</span>
                          <Badge
                            variant={fileDetails.linkShareMetadata.securityUpdateEligible ? 'default' : 'secondary'}
                          >
                            {fileDetails.linkShareMetadata.securityUpdateEligible ? 'Yes' : 'No'}
                          </Badge>
                        </div>
                      )}
                      {fileDetails.linkShareMetadata.securityUpdateEnabled !== undefined && (
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Security Update Enabled:</span>
                          <Badge
                            variant={fileDetails.linkShareMetadata.securityUpdateEnabled ? 'default' : 'secondary'}
                          >
                            {fileDetails.linkShareMetadata.securityUpdateEnabled ? 'Yes' : 'No'}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Sharing User */}
                {fileDetails.sharingUser && (
                  <div>
                    <h4 className="mb-2 text-sm font-medium">Shared By</h4>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={fileDetails.sharingUser.photoLink} />
                        <AvatarFallback>{getInitials(fileDetails.sharingUser.displayName)}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{fileDetails.sharingUser.displayName}</span>
                        <span className="text-muted-foreground text-xs">{fileDetails.sharingUser.emailAddress}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
