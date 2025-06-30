'use client'

import { MoreVertical, Eye, Download, Edit, Move, Copy, Share, RefreshCw, Trash2, Triangle, CopyIcon, Info } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { FileIcon } from '@/components/file-icon'
import { FileThumbnailPreview } from '@/components/ui/file-thumbnail-preview'
import { useTimezone } from '@/lib/hooks/use-timezone'
import { formatFileTime } from '@/lib/utils'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatFileSize } from '@/lib/google-drive/utils'
import type { DriveFile, DriveFolder } from '@/lib/google-drive/types'

import { DriveGridSkeleton } from './drive-skeleton'

type DriveItem = (DriveFile | DriveFolder) & {
  itemType?: 'file' | 'folder'
  isFolder: boolean
  canDownload?: boolean
  canRename?: boolean
  canShare?: boolean
  canTrash?: boolean
  canDelete?: boolean
  canUntrash?: boolean
  canMove?: boolean
  canCopy?: boolean
}

interface DriveDataViewProps {
  items: DriveItem[]
  viewMode: 'grid' | 'table'
  isSelectMode: boolean
  selectedItems: Set<string>
  visibleColumns: {
    name: boolean
    size: boolean
    owners: boolean
    mimeType: boolean
    createdTime: boolean
    modifiedTime: boolean
  }
  sortConfig?: {
    key: string
    direction: 'asc' | 'desc'
  } | null
  onSelectItem: (id: string) => void
  onSelectModeChange: (isSelectMode: boolean) => void
  onFolderClick: (id: string) => void
  onColumnsChange: (columns: any) => void
  onItemAction: (action: string, item: DriveItem) => void
  timezone?: string
  loading?: boolean
  loadingMore?: boolean
  hasMore?: boolean
  onLoadMore?: () => void
}

export function DriveDataView({
  items,
  viewMode,
  isSelectMode,
  selectedItems,
  visibleColumns,
  sortConfig,
  onSelectItem,
  onSelectModeChange,
  onFolderClick,
  onColumnsChange,
  onItemAction,
  timezone,
  loading = false,
  loadingMore = false,
  hasMore = false,
  onLoadMore,
}: DriveDataViewProps) {
  const { timezone: userTimezone } = useTimezone()
  const effectiveTimezone = timezone || userTimezone

  if (loading) {
    return <DriveGridSkeleton />
  }

  const renderContent = (item: DriveItem) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {/* Conditionally render details option */}
        <DropdownMenuItem onClick={() => onItemAction('details', item)}>
          <Info className="mr-2 h-4 w-4" />
          Details
        </DropdownMenuItem>

        {/* Conditionally render move option */}
        {item.canMove && (
          <DropdownMenuItem onClick={() => onItemAction('move', item)}>
            <Move className="mr-2 h-4 w-4" />
            Move
          </DropdownMenuItem>
        )}

        {/* Conditionally render copy option */}
        {item.canCopy && (
          <DropdownMenuItem onClick={() => onItemAction('copy', item)}>
            <Copy className="mr-2 h-4 w-4" />
            Copy
          </DropdownMenuItem>
        )}

        {/* Conditionally render preview option */}
        {!item.isFolder && (
          <DropdownMenuItem onClick={() => onItemAction('preview', item)}>
            <Eye className="mr-2 h-4 w-4" />
            Preview
          </DropdownMenuItem>
        )}

        {/* Conditionally render download option */}
        {item.canDownload && (
          <DropdownMenuItem onClick={() => onItemAction('download', item)}>
            <Download className="mr-2 h-4 w-4" />
            Download
          </DropdownMenuItem>
        )}

        {/* Conditionally render rename option */}
        {item.canRename && (
          <DropdownMenuItem onClick={() => onItemAction('rename', item)}>
            <Edit className="mr-2 h-4 w-4" />
            Rename
          </DropdownMenuItem>
        )}

        {/* Conditionally render share option */}
        {item.canShare && (
          <DropdownMenuItem onClick={() => onItemAction('share', item)}>
            <Share className="mr-2 h-4 w-4" />
            Share
          </DropdownMenuItem>
        )}

        {/* Conditionally render trash option */}
        {item.canTrash && (
          <DropdownMenuItem onClick={() => onItemAction('trash', item)} className="text-destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            Move to Trash
          </DropdownMenuItem>
        )}

        {/* Conditionally render delete option */}
        {item.canDelete && (
          <DropdownMenuItem onClick={() => onItemAction('delete', item)} className="text-destructive">
            <Triangle className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        )}

        {/* Conditionally render untrash option */}
        {item.canUntrash && (
          <DropdownMenuItem onClick={() => onItemAction('untrash', item)} className="text-destructive">
            <RefreshCw className="mr-2 h-4 w-4" />
            Untrash
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )

  return (
    <Card>
      <CardContent className="p-0">
        {items.length === 0 ? (
          <div className="text-muted-foreground py-12 text-center">
            <div className="mb-4 flex justify-center">
              <FileIcon mimeType="application/vnd.google-apps.folder" className="h-16 w-16" />
            </div>
            <h3 className="mb-2 text-lg font-medium">No files found</h3>
            <p className="text-sm">Try adjusting your search terms or filters</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="xs:grid-cols-2 grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4 xl:grid-cols-5">
            {items.map((item) => (
              <div
                key={item.id}
                className={`hover:bg-accent relative cursor-pointer rounded-lg border p-2 transition-colors sm:p-3 md:p-4 ${selectedItems.has(item.id) ? 'ring-primary bg-primary/5 ring-2' : ''}`}
                onClick={() => {
                  if (isSelectMode) {
                    onSelectItem(item.id)
                  } else if (item.isFolder) {
                    onFolderClick(item.id)
                  } else {
                    onItemAction('preview', item)
                  }
                }}
              >
                {isSelectMode && (
                  <div className="absolute top-2 left-2 z-10" onClick={(e) => e.stopPropagation()}>
                    <Checkbox checked={selectedItems.has(item.id)} onCheckedChange={() => onSelectItem(item.id)} className="bg-background !size-4 !h-4 !w-4" />
                  </div>
                )}
                <div className="mb-2 flex items-start justify-between">
                  <div className={`flex items-center ${isSelectMode ? 'ml-6' : ''}`}>
                    <FileThumbnailPreview thumbnailLink={item.thumbnailLink} fileName={item.name} mimeType={item.mimeType} modifiedTime={item.modifiedTime}>
                      <FileIcon mimeType={item.mimeType} className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8" />
                    </FileThumbnailPreview>
                  </div>
                  <div onClick={(e) => e.stopPropagation()}>{renderContent(item)}</div>
                </div>
                <div className="flex min-h-0 flex-col">
                  <h3 className="mb-1 truncate text-sm font-medium sm:text-base" title={item.name}>
                    {item.name}
                  </h3>
                  <p className="text-muted-foreground text-xs sm:text-sm">{formatFileTime(item.modifiedTime, effectiveTimezone)}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                {isSelectMode && (
                  <TableHead className="w-12">
                    <Checkbox
                      checked={items.length > 0 && items.every((item) => selectedItems.has(item.id))}
                      onCheckedChange={(checked) => {
                        items.forEach((item) => {
                          if (checked) {
                            onSelectItem(item.id)
                          } else if (selectedItems.has(item.id)) {
                            onSelectItem(item.id)
                          }
                        })
                      }}
                    />
                  </TableHead>
                )}
                {visibleColumns.name && (
                  <TableHead className="hover:bg-muted/50 cursor-pointer" onClick={() => onColumnsChange({ sortBy: 'name' })}>
                    <div className="flex items-center space-x-1">
                      <span>Name</span>
                      {sortConfig?.key === 'name' && <span className="text-xs">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>}
                    </div>
                  </TableHead>
                )}
                {visibleColumns.size && (
                  <TableHead className="hover:bg-muted/50 cursor-pointer" onClick={() => onColumnsChange({ sortBy: 'size' })}>
                    <div className="flex items-center space-x-1">
                      <span>Size</span>
                      {sortConfig?.key === 'size' && <span className="text-xs">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>}
                    </div>
                  </TableHead>
                )}
                {visibleColumns.owners && (
                  <TableHead className="hover:bg-muted/50 cursor-pointer" onClick={() => onColumnsChange({ sortBy: 'owners' })}>
                    <div className="flex items-center space-x-1">
                      <span>Owner</span>
                      {sortConfig?.key === 'owners' && <span className="text-xs">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>}
                    </div>
                  </TableHead>
                )}
                {visibleColumns.mimeType && (
                  <TableHead className="hover:bg-muted/50 cursor-pointer" onClick={() => onColumnsChange({ sortBy: 'mimeType' })}>
                    <div className="flex items-center space-x-1">
                      <span>Type</span>
                      {sortConfig?.key === 'mimeType' && <span className="text-xs">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>}
                    </div>
                  </TableHead>
                )}
                {visibleColumns.modifiedTime && (
                  <TableHead className="hover:bg-muted/50 cursor-pointer" onClick={() => onColumnsChange({ sortBy: 'modifiedTime' })}>
                    <div className="flex items-center space-x-1">
                      <span>Modified</span>
                      {sortConfig?.key === 'modifiedTime' && <span className="text-xs">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>}
                    </div>
                  </TableHead>
                )}
                {visibleColumns.createdTime && (
                  <TableHead className="hover:bg-muted/50 cursor-pointer" onClick={() => onColumnsChange({ sortBy: 'createdTime' })}>
                    <div className="flex items-center space-x-1">
                      <span>Created</span>
                      {sortConfig?.key === 'createdTime' && <span className="text-xs">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>}
                    </div>
                  </TableHead>
                )}
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow
                  key={item.id}
                  className={`cursor-pointer ${selectedItems.has(item.id) ? 'bg-primary/5' : ''}`}
                  onClick={() => (isSelectMode ? onSelectItem(item.id) : item.isFolder ? onFolderClick(item.id) : onItemAction('preview', item))}
                >
                  {isSelectMode && (
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox checked={selectedItems.has(item.id)} onCheckedChange={() => onSelectItem(item.id)} />
                    </TableCell>
                  )}
                  {visibleColumns.name && (
                    <TableCell
                      className="hover:bg-muted/50 group cursor-pointer transition-colors"
                      onClick={async (e) => {
                        e.stopPropagation()
                        try {
                          await navigator.clipboard.writeText(item.name)
                          const { toast } = await import('sonner')
                          toast.success('File name copied', { duration: 2000 })
                        } catch (err) {
                          const { errorToast } = await import('@/lib/utils')
                          errorToast.generic('Failed to copy file name')
                          console.error('Failed to copy file name:', err)
                        }
                      }}
                      title={`Click to copy: ${item.name}`}
                    >
                      <div className="flex items-center justify-between space-x-3">
                        <div className="flex items-center space-x-3">
                          <FileThumbnailPreview thumbnailLink={item.thumbnailLink} fileName={item.name} mimeType={item.mimeType} modifiedTime={item.modifiedTime}>
                            <FileIcon mimeType={item.mimeType} className="h-6 w-6" />
                          </FileThumbnailPreview>
                          <span className="font-medium">{item.name}</span>
                        </div>
                        <CopyIcon className="text-muted-foreground h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
                      </div>
                    </TableCell>
                  )}
                  {visibleColumns.size && (
                    <TableCell
                      className="hover:bg-muted/50 group cursor-pointer transition-colors"
                      onClick={async (e) => {
                        e.stopPropagation()
                        const sizeText = 'size' in item && item.size ? formatFileSize(parseInt(item.size)) : item.isFolder ? '—' : 'Unknown'
                        try {
                          await navigator.clipboard.writeText(sizeText)
                          const { toast } = await import('sonner')
                          toast.success('File size copied', { duration: 2000 })
                        } catch (err) {
                          const { errorToast } = await import('@/lib/utils')
                          errorToast.generic('Failed to copy file size')
                          console.error('Failed to copy file size:', err)
                        }
                      }}
                      title={`Click to copy size`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{'size' in item && item.size ? formatFileSize(parseInt(item.size)) : item.isFolder ? '—' : 'Unknown'}</span>
                        <CopyIcon className="text-muted-foreground h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
                      </div>
                    </TableCell>
                  )}
                  {visibleColumns.owners && (
                    <TableCell
                      className="hover:bg-muted/50 group cursor-pointer transition-colors"
                      onClick={async (e) => {
                        e.stopPropagation()
                        const email = item.owners?.[0]?.emailAddress
                        if (email) {
                          try {
                            await navigator.clipboard.writeText(email)
                            // Show toast notification
                            const { successToast } = await import('@/lib/toast')
                            successToast.copied()
                          } catch (err) {
                            const { errorToast } = await import('@/lib/utils')
                            errorToast.generic('Failed to copy email')
                            console.error('Failed to copy email:', err)
                          }
                        }
                      }}
                      title={`Click to copy: ${item.owners?.[0]?.emailAddress || 'No email available'}`}
                    >
                      <div className="flex items-center gap-2">
                        <span>{item.owners?.[0]?.emailAddress || 'Unknown'}</span>
                        {item.owners?.[0]?.emailAddress && <CopyIcon className="text-muted-foreground h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />}
                      </div>
                    </TableCell>
                  )}
                  {visibleColumns.mimeType && (
                    <TableCell
                      className="hover:bg-muted/50 group cursor-pointer transition-colors"
                      onClick={async (e) => {
                        e.stopPropagation()
                        try {
                          await navigator.clipboard.writeText(item.mimeType)
                          const { toast } = await import('sonner')
                          toast.success('MIME type copied', { duration: 2000 })
                        } catch (err) {
                          const { errorToast } = await import('@/lib/utils')
                          errorToast.generic('Failed to copy MIME type')
                          console.error('Failed to copy MIME type:', err)
                        }
                      }}
                      title={`Click to copy: ${item.mimeType}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground text-sm">{item.mimeType}</span>
                        <CopyIcon className="text-muted-foreground h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
                      </div>
                    </TableCell>
                  )}
                  {visibleColumns.modifiedTime && (
                    <TableCell
                      className="hover:bg-muted/50 group cursor-pointer transition-colors"
                      onClick={async (e) => {
                        e.stopPropagation()
                        const timeText = formatFileTime(item.modifiedTime, effectiveTimezone)
                        try {
                          await navigator.clipboard.writeText(timeText)
                          const { toast } = await import('sonner')
                          toast.success('Modified time copied', { duration: 2000 })
                        } catch (err) {
                          const { errorToast } = await import('@/lib/utils')
                          errorToast.generic('Failed to copy modified time')
                          console.error('Failed to copy modified time:', err)
                        }
                      }}
                      title={`Click to copy: ${formatFileTime(item.modifiedTime, effectiveTimezone)}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground text-sm">{formatFileTime(item.modifiedTime, effectiveTimezone)}</span>
                        <CopyIcon className="text-muted-foreground h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
                      </div>
                    </TableCell>
                  )}
                  {visibleColumns.createdTime && (
                    <TableCell
                      className="hover:bg-muted/50 group cursor-pointer transition-colors"
                      onClick={async (e) => {
                        e.stopPropagation()
                        const timeText = item.createdTime ? formatFileTime(item.createdTime, effectiveTimezone) : '—'
                        try {
                          await navigator.clipboard.writeText(timeText)
                          const { toast } = await import('sonner')
                          toast.success('Created time copied', { duration: 2000 })
                        } catch (err) {
                          const { errorToast } = await import('@/lib/utils')
                          errorToast.generic('Failed to copy created time')
                          console.error('Failed to copy created time:', err)
                        }
                      }}
                      title={`Click to copy: ${item.createdTime ? formatFileTime(item.createdTime, effectiveTimezone) : '—'}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground text-sm">{item.createdTime ? formatFileTime(item.createdTime, effectiveTimezone) : '—'}</span>
                        <CopyIcon className="text-muted-foreground h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
                      </div>
                    </TableCell>
                  )}
                  <TableCell onClick={(e) => e.stopPropagation()}>{renderContent(item)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {loadingMore && (
          <div className="flex justify-center py-4">
            <RefreshCw className="h-6 w-6 animate-spin" />
          </div>
        )}

        {hasMore && !loadingMore && onLoadMore && (
          <div className="flex justify-center py-4">
            <Button onClick={onLoadMore} variant="outline">
              Load More
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
