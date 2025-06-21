"use client";

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
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
  HardDrive,
  Hash,
  Clock,
  Globe,
  Lock,
  Users,
  Copy,
  Loader2,
  AlertCircle,
  Camera,
  Video,
  Image,
  MapPin,
  Database,
  Palette,
  Monitor,
  Server,
  Key,
  Tag,
  FileType,
  Fingerprint,
  Link,
  Archive
} from "lucide-react";
import { DriveFile, DriveFolder } from '@/lib/google-drive/types';
import { formatFileSize, formatDriveFileDate } from '@/lib/google-drive/utils';
import { formatFileTime, formatCreationTime } from '@/lib/timezone-utils';
import { FileIcon } from '@/components/file-icon';
import { toast } from "sonner";
import { getInitials } from '@/lib/utils';

interface FileDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  fileId: string;
  fileName: string;
  fileType: 'file' | 'folder';
}

interface DetailedFileInfo extends DriveFile {
  description?: string;
  lastModifyingUser?: {
    displayName: string;
    emailAddress: string;
    photoLink?: string;
  };
  sharingUser?: {
    displayName: string;
    emailAddress: string;
    photoLink?: string;
  };
  version?: string;
  md5Checksum?: string;
  sha1Checksum?: string;
  sha256Checksum?: string;
  quotaBytesUsed?: string;
  starred?: boolean;
  viewed?: boolean;
  explicitlyTrashed?: boolean;
  folderColorRgb?: string;
  fullFileExtension?: string;
  fileExtension?: string;
  originalFilename?: string;
  headRevisionId?: string;
  isAppAuthorized?: boolean;
  copyRequiresWriterPermission?: boolean;
  writersCanShare?: boolean;
  hasAugmentedPermissions?: boolean;
  ownedByMe?: boolean;
  driveId?: string;
  teamDriveId?: string;
  spaces?: string[];
  properties?: Record<string, string>;
  appProperties?: Record<string, string>;
  imageMediaMetadata?: {
    width?: number;
    height?: number;
    rotation?: number;
    location?: {
      latitude?: number;
      longitude?: number;
      altitude?: number;
    };
    time?: string;
    cameraMake?: string;
    cameraModel?: string;
    exposureTime?: number;
    aperture?: number;
    flashUsed?: boolean;
    focalLength?: number;
    isoSpeed?: number;
    meteringMode?: string;
    sensor?: string;
    exposureMode?: string;
    colorSpace?: string;
    whiteBalance?: string;
    exposureBias?: number;
    maxApertureValue?: number;
    subjectDistance?: number;
    lens?: string;
  };
  videoMediaMetadata?: {
    width?: number;
    height?: number;
    durationMillis?: string;
  };
  exportLinks?: Record<string, string>;
  shortcutDetails?: {
    targetId?: string;
    targetMimeType?: string;
    targetResourceKey?: string;
  };
  contentRestrictions?: Array<{
    readOnly?: boolean;
    reason?: string;
    restrictingUser?: {
      displayName: string;
      emailAddress: string;
      photoLink?: string;
    };
    restrictionTime?: string;
    type?: string;
  }>;
  resourceKey?: string;
  linkShareMetadata?: {
    securityUpdateEligible?: boolean;
    securityUpdateEnabled?: boolean;
  };
  labelInfo?: {
    labels?: Array<{
      id?: string;
      revisionId?: string;
      kind?: string;
      fields?: Record<string, any>;
    }>;
  };
  capabilities?: Record<string, boolean>;
}

export function FileDetailsDialog({ 
  isOpen, 
  onClose, 
  fileId, 
  fileName, 
  fileType 
}: FileDetailsDialogProps) {
  const [fileDetails, setFileDetails] = useState<DetailedFileInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && fileId) {
      fetchFileDetails();
    }
  }, [isOpen, fileId]);

  const fetchFileDetails = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/drive/files/${fileId}/details`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch file details');
      }
      
      const details = await response.json();
      setFileDetails(details);
    } catch (error) {
      // Log error for debugging in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching file details:', error);
      }
      setError(error instanceof Error ? error.message : 'Failed to fetch file details');
      toast.error('Failed to load file details');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard`);
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const renderPermissions = () => {
    if (!fileDetails?.permissions || fileDetails.permissions.length === 0) {
      return <span className="text-muted-foreground text-sm">Private</span>;
    }

    const permissionCount = fileDetails.permissions.length;
    const hasPublicAccess = fileDetails.permissions.some(p => p.type === 'anyone');
    
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          {hasPublicAccess ? <Globe className="h-4 w-4" /> : <Users className="h-4 w-4" />}
          <span className="text-sm">
            {hasPublicAccess ? 'Public' : `Shared with ${permissionCount} ${permissionCount === 1 ? 'person' : 'people'}`}
          </span>
        </div>
        {fileDetails.shared && <Badge variant="secondary" className="text-xs">Shared</Badge>}
      </div>
    );
  };

  const renderCapabilities = () => {
    if (!fileDetails?.capabilities) return null;

    const capabilities = fileDetails.capabilities;
    const importantActions = [
      { key: 'canEdit', label: 'Edit', icon: FileText },
      { key: 'canShare', label: 'Share', icon: Share2 },
      { key: 'canCopy', label: 'Copy', icon: Copy },
      { key: 'canDownload', label: 'Download', icon: Download },
      { key: 'canDelete', label: 'Delete', icon: Lock },
      { key: 'canRename', label: 'Rename', icon: FileText },
    ];

    const allCapabilities = Object.entries(capabilities).filter(([key, value]) => value === true);
    const deniedCapabilities = Object.entries(capabilities).filter(([key, value]) => value === false);

    return (
      <div className="space-y-3">
        <div>
          <h4 className="text-sm font-medium text-green-600 mb-2">
            Allowed Capabilities ({allCapabilities.length})
          </h4>
          <div className="flex flex-wrap gap-1">
            {allCapabilities.map(([key, value]) => (
              <Badge key={key} variant="outline" className="border-green-200 text-green-700 text-xs">
                {key.replace('can', '').replace(/([A-Z])/g, ' $1').trim()}
              </Badge>
            ))}
          </div>
        </div>
        
        {deniedCapabilities.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-red-600 mb-2">
              Restricted Capabilities ({deniedCapabilities.length})
            </h4>
            <div className="flex flex-wrap gap-1">
              {deniedCapabilities.slice(0, 10).map(([key, value]) => (
                <Badge key={key} variant="outline" className="border-red-200 text-red-700 text-xs">
                  {key.replace('can', '').replace(/([A-Z])/g, ' $1').trim()}
                </Badge>
              ))}
              {deniedCapabilities.length > 10 && (
                <Badge variant="outline" className="border-gray-200 text-gray-700 text-xs">
                  +{deniedCapabilities.length - 10} more
                </Badge>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderImageMetadata = () => {
    if (!fileDetails?.imageMediaMetadata) return null;

    const meta = fileDetails.imageMediaMetadata;
    
    return (
      <section>
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Camera className="h-5 w-5" />
          Image Metadata
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            {meta.width && meta.height && (
              <div className="flex items-center justify-between">
                <span className="font-medium">Dimensions:</span>
                <span className="text-sm">{meta.width} × {meta.height} pixels</span>
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
                <span className="text-sm">1/{Math.round(1/meta.exposureTime)}s</span>
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
                <Badge variant={meta.flashUsed ? "default" : "secondary"}>
                  {meta.flashUsed ? "Used" : "Not Used"}
                </Badge>
              </div>
            )}
          </div>
        </div>

        {meta.location && (meta.location.latitude || meta.location.longitude) && (
          <div className="mt-4">
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Location Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
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
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Color & Technical Settings
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
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
    );
  };

  const renderVideoMetadata = () => {
    if (!fileDetails?.videoMediaMetadata) return null;

    const meta = fileDetails.videoMediaMetadata;
    const duration = meta.durationMillis ? parseInt(meta.durationMillis) : null;
    
    return (
      <section>
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Video className="h-5 w-5" />
          Video Metadata
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {meta.width && meta.height && (
            <div className="flex items-center justify-between">
              <span className="font-medium">Resolution:</span>
              <span className="text-sm">{meta.width} × {meta.height} pixels</span>
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
              <span className="text-sm">
                {(meta.width / meta.height).toFixed(2)}:1
              </span>
            </div>
          )}
        </div>
      </section>
    );
  };

  const renderTechnicalDetails = () => {
    return (
      <section>
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Database className="h-5 w-5" />
          Technical Details
        </h3>
        <div className="space-y-4">
          {/* File Extensions */}
          {(fileDetails?.fileExtension || fileDetails?.fullFileExtension) && (
            <div>
              <h4 className="text-sm font-medium mb-2">File Extensions</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
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
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <Fingerprint className="h-4 w-4" />
              Checksums & Integrity
            </h4>
            <div className="space-y-2">
              {fileDetails?.md5Checksum && (
                <div className="flex items-center justify-between">
                  <span className="font-medium">MD5:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono truncate max-w-48">{fileDetails.md5Checksum}</span>
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
                    <span className="text-xs font-mono truncate max-w-48">{fileDetails.sha1Checksum}</span>
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
                    <span className="text-xs font-mono truncate max-w-48">{fileDetails.sha256Checksum}</span>
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
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <Server className="h-4 w-4" />
              System Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {fileDetails?.version && (
                <div className="flex items-center justify-between">
                  <span className="font-medium">Version:</span>
                  <span className="text-sm">{fileDetails.version}</span>
                </div>
              )}
              {fileDetails?.headRevisionId && (
                <div className="flex items-center justify-between">
                  <span className="font-medium">Revision ID:</span>
                  <span className="text-xs font-mono truncate max-w-32">{fileDetails.headRevisionId}</span>
                </div>
              )}
              {fileDetails?.resourceKey && (
                <div className="flex items-center justify-between">
                  <span className="font-medium">Resource Key:</span>
                  <span className="text-xs font-mono truncate max-w-32">{fileDetails.resourceKey}</span>
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
              <h4 className="text-sm font-medium mb-2">Drive Information</h4>
              <div className="space-y-2">
                {fileDetails.driveId && (
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Drive ID:</span>
                    <span className="text-xs font-mono truncate max-w-48">{fileDetails.driveId}</span>
                  </div>
                )}
                {fileDetails.teamDriveId && (
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Team Drive ID:</span>
                    <span className="text-xs font-mono truncate max-w-48">{fileDetails.teamDriveId}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>
    );
  };

  const renderFileProperties = () => {
    const hasProperties = (fileDetails?.properties && Object.keys(fileDetails.properties).length > 0) ||
                         (fileDetails?.appProperties && Object.keys(fileDetails.appProperties).length > 0);
    
    if (!hasProperties) return null;

    return (
      <section>
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Tag className="h-5 w-5" />
          Custom Properties
        </h3>
        
        {fileDetails?.properties && Object.keys(fileDetails.properties).length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium mb-2">User Properties</h4>
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
            <h4 className="text-sm font-medium mb-2">App Properties</h4>
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
    );
  };

  const renderExportLinks = () => {
    if (!fileDetails?.exportLinks || Object.keys(fileDetails.exportLinks).length === 0) return null;

    return (
      <section>
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Archive className="h-5 w-5" />
          Export Links
        </h3>
        <div className="space-y-2">
          {Object.entries(fileDetails.exportLinks).map(([format, link]) => (
            <div key={format} className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(link, '_blank')}
                className="flex-1"
              >
                <Download className="h-4 w-4 mr-2" />
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
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
          <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <span className="text-red-700">{error}</span>
          </div>
        )}

        {fileDetails && !loading && !error && (
          <div className="space-y-6">
            {/* Basic Information */}
            <section>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Name:</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm truncate max-w-48">{fileDetails.name}</span>
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
                    <Badge variant="secondary">{fileDetails.mimeType.split('/').pop()?.toUpperCase() || 'Unknown'}</Badge>
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
                      <span className="text-xs font-mono truncate max-w-32">{fileDetails.id}</span>
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
                      <Badge variant="outline" className="text-yellow-600 border-yellow-300">
                        <Star className="h-3 w-3 mr-1 fill-current" />
                        Starred
                      </Badge>
                    )}
                    {fileDetails.viewed && (
                      <Badge variant="outline" className="text-blue-600 border-blue-300">
                        <Eye className="h-3 w-3 mr-1" />
                        Viewed
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {fileDetails.description && (
                <div className="mt-4">
                  <span className="font-medium">Description:</span>
                  <p className="text-sm text-muted-foreground mt-1 p-3 bg-muted rounded-lg">
                    {fileDetails.description}
                  </p>
                </div>
              )}
            </section>

            <Separator />

            {/* Dates and History */}
            <section>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Dates & History
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        <span className="text-xs text-muted-foreground">{fileDetails.lastModifyingUser.emailAddress}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>

            <Separator />

            {/* Ownership and Sharing */}
            <section>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <User className="h-5 w-5" />
                Ownership & Sharing
              </h3>
              
              {fileDetails.owners && fileDetails.owners.length > 0 && (
                <div className="mb-4">
                  <span className="font-medium">Owner:</span>
                  <div className="flex items-center gap-2 mt-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={fileDetails.owners[0].photoLink} />
                      <AvatarFallback>
                        {getInitials(fileDetails.owners[0].displayName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{fileDetails.owners[0].displayName}</span>
                      <span className="text-xs text-muted-foreground">{fileDetails.owners[0].emailAddress}</span>
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
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Permissions & Security
              </h3>
              
              {fileDetails.md5Checksum && (
                <div className="mb-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">MD5 Checksum:</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono truncate max-w-64">{fileDetails.md5Checksum}</span>
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
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
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
                      <Eye className="h-4 w-4 mr-2" />
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
                      <Download className="h-4 w-4 mr-2" />
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
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                Extended Metadata
              </h3>
              <div className="space-y-4">
                {/* File Status & Flags */}
                <div>
                  <h4 className="text-sm font-medium mb-2">File Status</h4>
                  <div className="flex flex-wrap gap-2">
                    {fileDetails.ownedByMe && (
                      <Badge variant="outline" className="border-blue-200 text-blue-700">
                        <User className="h-3 w-3 mr-1" />
                        Owned by Me
                      </Badge>
                    )}
                    {fileDetails.starred && (
                      <Badge variant="outline" className="border-yellow-200 text-yellow-700">
                        <Star className="h-3 w-3 mr-1 fill-current" />
                        Starred
                      </Badge>
                    )}
                    {fileDetails.viewed && (
                      <Badge variant="outline" className="border-green-200 text-green-700">
                        <Eye className="h-3 w-3 mr-1" />
                        Viewed
                      </Badge>
                    )}
                    {fileDetails.shared && (
                      <Badge variant="outline" className="border-purple-200 text-purple-700">
                        <Share2 className="h-3 w-3 mr-1" />
                        Shared
                      </Badge>
                    )}
                    {fileDetails.explicitlyTrashed && (
                      <Badge variant="outline" className="border-red-200 text-red-700">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Explicitly Trashed
                      </Badge>
                    )}
                    {fileDetails.isAppAuthorized && (
                      <Badge variant="outline" className="border-green-200 text-green-700">
                        <Shield className="h-3 w-3 mr-1" />
                        App Authorized
                      </Badge>
                    )}
                  </div>
                </div>

                {/* File Restrictions */}
                <div>
                  <h4 className="text-sm font-medium mb-2">File Restrictions</h4>
                  <div className="flex flex-wrap gap-2">
                    {fileDetails.copyRequiresWriterPermission && (
                      <Badge variant="outline" className="border-orange-200 text-orange-700">
                        <Lock className="h-3 w-3 mr-1" />
                        Copy Requires Writer Permission
                      </Badge>
                    )}
                    {fileDetails.writersCanShare !== undefined && (
                      <Badge variant="outline" className={fileDetails.writersCanShare ? "border-green-200 text-green-700" : "border-red-200 text-red-700"}>
                        <Share2 className="h-3 w-3 mr-1" />
                        Writers {fileDetails.writersCanShare ? "Can" : "Cannot"} Share
                      </Badge>
                    )}
                    {fileDetails.hasAugmentedPermissions && (
                      <Badge variant="outline" className="border-blue-200 text-blue-700">
                        <Shield className="h-3 w-3 mr-1" />
                        Augmented Permissions
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Original File Information */}
                {(fileDetails.originalFilename || fileDetails.folderColorRgb) && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Original File Information</h4>
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
                              className="w-4 h-4 rounded border" 
                              style={{ backgroundColor: fileDetails.folderColorRgb }}
                            />
                            <span className="text-sm font-mono">{fileDetails.folderColorRgb}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Content Restrictions */}
                {fileDetails.contentRestrictions && fileDetails.contentRestrictions.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2 text-red-600">Content Restrictions</h4>
                    <div className="space-y-2">
                      {fileDetails.contentRestrictions.map((restriction, index) => (
                        <div key={index} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Lock className="h-4 w-4 text-red-500" />
                            <span className="font-medium text-red-700">
                              {restriction.type || 'Restriction'}
                            </span>
                          </div>
                          {restriction.reason && (
                            <p className="text-sm text-red-600 mb-2">{restriction.reason}</p>
                          )}
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
                                <span className="text-xs text-muted-foreground ml-2">{restriction.restrictingUser.emailAddress}</span>
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
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                      <Link className="h-4 w-4" />
                      Shortcut Information
                    </h4>
                    <div className="space-y-2">
                      {fileDetails.shortcutDetails.targetId && (
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Target ID:</span>
                          <span className="text-xs font-mono">{fileDetails.shortcutDetails.targetId}</span>
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
                    <h4 className="text-sm font-medium mb-2">Link Share Security</h4>
                    <div className="space-y-2">
                      {fileDetails.linkShareMetadata.securityUpdateEligible !== undefined && (
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Security Update Eligible:</span>
                          <Badge variant={fileDetails.linkShareMetadata.securityUpdateEligible ? "default" : "secondary"}>
                            {fileDetails.linkShareMetadata.securityUpdateEligible ? "Yes" : "No"}
                          </Badge>
                        </div>
                      )}
                      {fileDetails.linkShareMetadata.securityUpdateEnabled !== undefined && (
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Security Update Enabled:</span>
                          <Badge variant={fileDetails.linkShareMetadata.securityUpdateEnabled ? "default" : "secondary"}>
                            {fileDetails.linkShareMetadata.securityUpdateEnabled ? "Yes" : "No"}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Sharing User */}
                {fileDetails.sharingUser && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Shared By</h4>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={fileDetails.sharingUser.photoLink} />
                        <AvatarFallback>
                          {getInitials(fileDetails.sharingUser.displayName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{fileDetails.sharingUser.displayName}</span>
                        <span className="text-xs text-muted-foreground">{fileDetails.sharingUser.emailAddress}</span>
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
  );
}