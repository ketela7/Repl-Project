'use client'

import { Card, CardContent } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Checkbox } from '@/shared/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu'
import { FileIcon } from '@/shared/components/file-icon'
import { FileThumbnailPreview } from '@/shared/components/ui/file-thumbnail-preview'
import { DriveGridSkeleton } from './drive-skeleton'
import { useTimezone } from '@/shared/hooks/use-timezone'
import { formatFileTime } from '@/shared/utils'
import {
  MoreVertical,
  Eye,
  Download,
  Edit,
  Move,
  Copy,
  Share,
  RefreshCw,
  Trash2,
  Copy as CopyIcon,
} from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table'
import { formatFileSize } from '@/lib/google-drive/utils'
import type { DriveFile, DriveFolder } from '@/lib/google-drive/types'

type DriveItem = (DriveFile | DriveFolder) & { itemType?: 'file' | 'folder' }

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

  const isFolder = (item: DriveItem): boolean => {
    return item.mimeType === 'application/vnd.google-apps.folder'
  }

  if (loading && items.length === 0) {
    return <DriveGridSkeleton />
  }

  return (
    <Card>
      <CardContent className="p-0">
        {items.length === 0 ? (
          <div className="text-muted-foreground py-12 text-center">
            <div className="mb-4 flex justify-center">
              <FileIcon
                mimeType="application/vnd.google-apps.folder"
                className="h-16 w-16"
              />
            </div>
            <h3 className="mb-2 text-lg font-medium">No files found</h3>
            <p className="text-sm">
              Try adjusting your search terms or filters
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="xs:grid-cols-2 grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4 xl:grid-cols-5">
            {items.map((item) => (
              <div
                key={item.id}
                className={`hover:bg-accent relative cursor-pointer rounded-lg border p-2 transition-colors sm:p-3 md:p-4 ${
                  selectedItems.has(item.id)
                    ? 'ring-primary bg-primary/5 ring-2'
                    : ''
                }`}
                onClick={() =>
                  isSelectMode
                    ? onSelectItem(item.id)
                    : isFolder(item)
                      ? onFolderClick(item.id)
                      : onItemAction('preview', item)
                }
              >
                {isSelectMode && (
                  <div
                    className="absolute top-2 left-2 z-10"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Checkbox
                      checked={selectedItems.has(item.id)}
                      onCheckedChange={() => onSelectItem(item.id)}
                      className="bg-background !size-4 !h-4 !w-4"
                    />
                  </div>
                )}
                <div className="mb-2 flex items-start justify-between">
                  <div
                    className={`flex items-center ${isSelectMode ? 'ml-6' : ''}`}
                  >
                    <FileThumbnailPreview
                      thumbnailLink={item.thumbnailLink}
                      fileName={item.name}
                      mimeType={item.mimeType}
                      modifiedTime={item.modifiedTime}
                    >
                      <FileIcon
                        mimeType={item.mimeType}
                        className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8"
                      />
                    </FileThumbnailPreview>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      asChild
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 sm:h-8 sm:w-8"
                      >
                        <MoreVertical className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <DropdownMenuItem
                        onClick={() => onItemAction('preview', item)}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Preview
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onItemAction('download', item)}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => onItemAction('rename', item)}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onItemAction('move', item)}
                      >
                        <Move className="mr-2 h-4 w-4" />
                        Move
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onItemAction('copy', item)}
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        Copy
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onItemAction('share', item)}
                      >
                        <Share className="mr-2 h-4 w-4" />
                        Share
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => onItemAction('delete', item)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="flex min-h-0 flex-col">
                  <h3
                    className="mb-1 truncate text-sm font-medium sm:text-base"
                    title={item.name}
                  >
                    {item.name}
                  </h3>
                  <p className="text-muted-foreground text-xs sm:text-sm">
                    {formatFileTime(item.modifiedTime, effectiveTimezone)}
                  </p>
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
                      checked={
                        items.length > 0 &&
                        items.every((item) => selectedItems.has(item.id))
                      }
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
                  <TableHead
                    className="hover:bg-muted/50 cursor-pointer"
                    onClick={() => onColumnsChange({ sortBy: 'name' })}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Name</span>
                      {sortConfig?.key === 'name' && (
                        <span className="text-xs">
                          {sortConfig.direction === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </TableHead>
                )}
                {visibleColumns.size && (
                  <TableHead
                    className="hover:bg-muted/50 cursor-pointer"
                    onClick={() => onColumnsChange({ sortBy: 'size' })}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Size</span>
                      {sortConfig?.key === 'size' && (
                        <span className="text-xs">
                          {sortConfig.direction === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </TableHead>
                )}
                {visibleColumns.owners && (
                  <TableHead
                    className="hover:bg-muted/50 cursor-pointer"
                    onClick={() => onColumnsChange({ sortBy: 'owners' })}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Owner</span>
                      {sortConfig?.key === 'owners' && (
                        <span className="text-xs">
                          {sortConfig.direction === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </TableHead>
                )}
                {visibleColumns.mimeType && (
                  <TableHead
                    className="hover:bg-muted/50 cursor-pointer"
                    onClick={() => onColumnsChange({ sortBy: 'mimeType' })}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Type</span>
                      {sortConfig?.key === 'mimeType' && (
                        <span className="text-xs">
                          {sortConfig.direction === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </TableHead>
                )}
                {visibleColumns.modifiedTime && (
                  <TableHead
                    className="hover:bg-muted/50 cursor-pointer"
                    onClick={() => onColumnsChange({ sortBy: 'modifiedTime' })}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Modified</span>
                      {sortConfig?.key === 'modifiedTime' && (
                        <span className="text-xs">
                          {sortConfig.direction === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </TableHead>
                )}
                {visibleColumns.createdTime && (
                  <TableHead
                    className="hover:bg-muted/50 cursor-pointer"
                    onClick={() => onColumnsChange({ sortBy: 'createdTime' })}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Created</span>
                      {sortConfig?.key === 'createdTime' && (
                        <span className="text-xs">
                          {sortConfig.direction === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
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
                  onClick={() =>
                    isSelectMode
                      ? onSelectItem(item.id)
                      : isFolder(item)
                        ? onFolderClick(item.id)
                        : onItemAction('preview', item)
                  }
                >
                  {isSelectMode && (
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedItems.has(item.id)}
                        onCheckedChange={() => onSelectItem(item.id)}
                      />
                    </TableCell>
                  )}
                  {visibleColumns.name && (
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <FileThumbnailPreview
                          thumbnailLink={item.thumbnailLink}
                          fileName={item.name}
                          mimeType={item.mimeType}
                          modifiedTime={item.modifiedTime}
                        >
                          <FileIcon
                            mimeType={item.mimeType}
                            className="h-6 w-6"
                          />
                        </FileThumbnailPreview>
                        <span className="font-medium">{item.name}</span>
                      </div>
                    </TableCell>
                  )}
                  {visibleColumns.size && (
                    <TableCell>
                      {'size' in item && item.size
                        ? formatFileSize(parseInt(item.size))
                        : isFolder(item)
                          ? '—'
                          : 'Unknown'}
                    </TableCell>
                  )}
                  {visibleColumns.owners && (
                    <TableCell 
                      className="cursor-pointer hover:bg-muted/50 transition-colors group"
                      onClick={async (e) => {
                        e.stopPropagation()
                        const email = item.owners?.[0]?.emailAddress
                        if (email) {
                          try {
                            await navigator.clipboard.writeText(email)
                            // Show toast notification
                            const { toast } = await import('@/shared/utils/toast')
                            toast.success('Copied to clipboard', {
                              description: email,
                              duration: 2000,
                            })
                          } catch (err) {
                            const { toast } = await import('@/shared/utils/toast')
                            toast.error('Failed to copy email')
                            console.error('Failed to copy email:', err)
                          }
                        }
                      }}
                      title={`Click to copy: ${item.owners?.[0]?.emailAddress || 'No email available'}`}
                    >
                      <div className="flex items-center gap-2">
                        <span>{item.owners?.[0]?.emailAddress || item.owners?.[0]?.displayName || 'Unknown'}</span>
                        {item.owners?.[0]?.emailAddress && (
                          <CopyIcon className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </div>
                    </TableCell>
                  )}
                  {visibleColumns.mimeType && (
                    <TableCell>
                      <span className="text-muted-foreground text-sm">
                        {isFolder(item)
                          ? 'Folder'
                          : item.mimeType.split('/').pop()?.toUpperCase() ||
                            'File'}
                      </span>
                    </TableCell>
                  )}
                  {visibleColumns.modifiedTime && (
                    <TableCell>
                      <span className="text-muted-foreground text-sm">
                        {formatFileTime(item.modifiedTime, effectiveTimezone)}
                      </span>
                    </TableCell>
                  )}
                  {visibleColumns.createdTime && (
                    <TableCell>
                      <span className="text-muted-foreground text-sm">
                        {item.createdTime
                          ? formatFileTime(item.createdTime, effectiveTimezone)
                          : '—'}
                      </span>
                    </TableCell>
                  )}
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => onItemAction('preview', item)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Preview
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onItemAction('download', item)}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => onItemAction('rename', item)}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onItemAction('move', item)}
                        >
                          <Move className="mr-2 h-4 w-4" />
                          Move
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onItemAction('copy', item)}
                        >
                          <Copy className="mr-2 h-4 w-4" />
                          Copy
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onItemAction('share', item)}
                        >
                          <Share className="mr-2 h-4 w-4" />
                          Share
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => onItemAction('delete', item)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
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
