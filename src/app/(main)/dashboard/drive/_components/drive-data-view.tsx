'use client'

import { useCallback, useMemo } from 'react'
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
  CopyIcon,
  Info,
  FileDown,
} from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { FileIcon } from '@/components/file-icon'
import { FileThumbnailPreview } from '@/components/ui/file-thumbnail-preview'
import { useTimezone } from '@/lib/hooks/use-timezone'
import { formatFileTime } from '@/lib/utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatFileSize } from '@/lib/google-drive/utils'
import { toast } from 'sonner'
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
  canExport?: boolean
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
  onFolderClick: (id: string) => void
  onColumnsChange: (columns: any) => void
  onItemAction: (action: string, item: DriveItem) => void
  timezone?: string
  loading?: boolean
  loadingMore?: boolean
  hasMore?: boolean
  onLoadMore?: () => void
}

// Optimized copy function to reduce code duplication
const useCopyToClipboard = () => {
  return useCallback(async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(`${label} copied`, { duration: 2000 })
    } catch (err) {
      const { errorToast } = await import('@/lib/utils')
      errorToast.generic(`Failed to copy ${label.toLowerCase()}`)
      console.error(`Failed to copy ${label.toLowerCase()}:`, err)
    }
  }, [])
}

// Optimized cell component with copy functionality
const CopyableCell = ({
  children,
  value,
  label,
  className = '',
  onClick,
  title,
}: {
  children: React.ReactNode
  value: string
  label: string
  className?: string
  onClick?: (e: React.MouseEvent) => void
  title?: string
}) => {
  const copyToClipboard = useCopyToClipboard()

  const handleClick = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation()
      if (onClick) {
        onClick(e)
      } else {
        await copyToClipboard(value, label)
      }
    },
    [copyToClipboard, value, label, onClick],
  )

  return (
    <TableCell className={className}>
      <div className="flex items-center gap-2">
        <div className="flex min-w-0 flex-1 items-center space-x-3">{children}</div>
        <div
          className="text-muted-foreground/60 hover:text-muted-foreground h-3 w-3 flex-shrink-0 cursor-pointer transition-colors"
          onClick={handleClick}
          title={title || `Click to copy: ${value}`}
        >
          <CopyIcon className="h-3 w-3" />
        </div>
      </div>
    </TableCell>
  )
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

  if (loading) {
    return <DriveGridSkeleton />
  }

  // Memoized handlers for better performance
  const handleItemClick = useCallback(
    (item: DriveItem) => {

      if (isSelectMode) {
        onSelectItem(item.id)
      } else if (item.isFolder) {

        onFolderClick(item.id)
      } else {
        onItemAction('preview', item)
      }
    },
    [isSelectMode, onSelectItem, onFolderClick, onItemAction],
  )

  // Memoized table headers for performance
  const tableHeaders = useMemo(
    () =>
      [
        { key: 'name', label: 'Name', visible: visibleColumns.name },
        { key: 'size', label: 'Size', visible: visibleColumns.size },
        { key: 'owners', label: 'Owner', visible: visibleColumns.owners },
        { key: 'mimeType', label: 'Type', visible: visibleColumns.mimeType },
        { key: 'modifiedTime', label: 'Modified', visible: visibleColumns.modifiedTime },
        { key: 'createdTime', label: 'Created', visible: visibleColumns.createdTime },
      ].filter(header => header.visible),
    [visibleColumns],
  )

  // Optimized menu items configuration with condition handling
  const getMenuItems = useMemo(
    () => (item: DriveItem) => {
      const menuItems = [
        { key: 'details', label: 'Details', icon: Info, condition: true },
        { key: 'preview', label: 'Preview', icon: Eye, condition: !item.isFolder },
        { key: 'move', label: 'Move', icon: Move, condition: item.canMove === true },
        { key: 'copy', label: 'Copy', icon: Copy, condition: item.canCopy === true },
        {
          key: 'download',
          label: 'Download',
          icon: Download,
          condition: item.canDownload === true,
        },
        { key: 'rename', label: 'Rename', icon: Edit, condition: item.canRename === true },
        { key: 'share', label: 'Share', icon: Share, condition: item.canShare === true },
        {
          key: 'trash',
          label: 'Move to Trash',
          icon: Trash2,
          condition: item.canTrash === true,
          destructive: true,
        },
        {
          key: 'delete',
          label: 'Delete',
          icon: Trash2,
          condition: item.canDelete === true,
          destructive: true,
        },
        {
          key: 'untrash',
          label: 'Untrash',
          icon: RefreshCw,
          condition: item.canUntrash === true,
          destructive: true,
        },
        { key: 'export', label: 'Export', icon: FileDown, condition: item.canExport === true },
      ]

      // Filter menu items based on condition boolean
      return menuItems.filter(menuItem => {
        // Ensure condition is explicitly true (not just truthy)
        return menuItem.condition === true
      })
    },
    [],
  )

  const renderContent = useCallback(
    (item: DriveItem) => {
      const availableMenuItems = getMenuItems(item)

      // Only render dropdown if there are available menu items
      if (availableMenuItems.length === 0) {
        return null
      }

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {availableMenuItems.map(({ key, label, icon: Icon, destructive }) => (
              <DropdownMenuItem
                key={key}
                onClick={() => onItemAction(key, item)}
                className={destructive ? 'text-destructive' : ''}
              >
                <Icon className="mr-2 h-4 w-4" />
                {label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
    [getMenuItems, onItemAction],
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
            {items.map(item => (
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
                  <div className="absolute top-2 left-2 z-10" onClick={e => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedItems.has(item.id)}
                      onCheckedChange={() => onSelectItem(item.id)}
                      className="bg-background !size-4 !h-4 !w-4"
                    />
                  </div>
                )}
                <div className="mb-2 flex items-start justify-between">
                  <div className={`flex items-center ${isSelectMode ? 'ml-6' : ''}`}>
                    <FileThumbnailPreview
                      {...(item.thumbnailLink && { thumbnailLink: item.thumbnailLink })}
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
                  <div onClick={e => e.stopPropagation()}>{renderContent(item)}</div>
                </div>
                <div className="flex min-h-0 flex-col">
                  <h3 className="mb-1 truncate text-sm font-medium sm:text-base" title={item.name}>
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
                    {/* <Checkbox checked={items.length > 0 && items.every((item) => selectedItems.has(item.id))} onCheckedChange={handleSelectAll} /> */}
                  </TableHead>
                )}
                {tableHeaders.map(({ key, label }) => (
                  <TableHead
                    key={key}
                    className="hover:bg-muted/50 cursor-pointer"
                    onClick={() => onColumnsChange({ sortBy: key })}
                  >
                    <div className="flex items-center space-x-1">
                      <span>{label}</span>
                      {sortConfig?.key === key && (
                        <span className="text-xs">
                          {sortConfig.direction === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </TableHead>
                ))}
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map(item => (
                <TableRow
                  key={item.id}
                  className={`cursor-pointer ${selectedItems.has(item.id) ? 'bg-primary/5' : ''}`}
                  onClick={() => handleItemClick(item)}
                >
                  {isSelectMode && (
                    <TableCell onClick={e => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedItems.has(item.id)}
                        onCheckedChange={() => onSelectItem(item.id)}
                      />
                    </TableCell>
                  )}
                  {visibleColumns.name && (
                    <CopyableCell value={item.name} label="File name">
                      <FileThumbnailPreview
                        {...(item.thumbnailLink && { thumbnailLink: item.thumbnailLink })}
                        fileName={item.name}
                        mimeType={item.mimeType}
                        modifiedTime={item.modifiedTime}
                      >
                        <FileIcon mimeType={item.mimeType} className="h-6 w-6" />
                      </FileThumbnailPreview>
                      <span className="font-medium">{item.name}</span>
                    </CopyableCell>
                  )}
                  {visibleColumns.size && (
                    <CopyableCell
                      value={
                        'size' in item && item.size
                          ? formatFileSize(parseInt(item.size))
                          : item.isFolder
                            ? '—'
                            : 'Unknown'
                      }
                      label="File size"
                    >
                      <span>
                        {'size' in item && item.size
                          ? formatFileSize(parseInt(item.size))
                          : item.isFolder
                            ? '—'
                            : 'Unknown'}
                      </span>
                    </CopyableCell>
                  )}
                  {visibleColumns.owners && (
                    <TableCell
                      className="hover:bg-muted/50 group cursor-pointer transition-colors"
                      onClick={async e => {
                        e.stopPropagation()
                        const email = item.owners?.[0]?.emailAddress
                        if (email) {
                          try {
                            await navigator.clipboard.writeText(email)
                            // Show toast notification
                            const { successToast } = await import('@/components/ui/toast')
                            successToast.copied()
                          } catch (err) {
                            const { errorToast } = await import('@/lib/utils')
                            errorToast.generic('Failed to copy email')

                          }
                        }
                      }}
                      title={`Click to copy: ${item.owners?.[0]?.emailAddress || 'No email available'}`}
                    >
                      <div className="flex items-center gap-2">
                        <span>{item.owners?.[0]?.emailAddress || 'Unknown'}</span>
                        {item.owners?.[0]?.emailAddress && (
                          <CopyIcon className="text-muted-foreground h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
                        )}
                      </div>
                    </TableCell>
                  )}
                  {visibleColumns.mimeType && (
                    <CopyableCell value={item.mimeType} label="MIME type">
                      <span className="text-muted-foreground text-sm">{item.mimeType}</span>
                    </CopyableCell>
                  )}
                  {visibleColumns.modifiedTime && (
                    <CopyableCell
                      value={formatFileTime(item.modifiedTime, effectiveTimezone)}
                      label="Modified time"
                    >
                      <span className="text-muted-foreground text-sm">
                        {formatFileTime(item.modifiedTime, effectiveTimezone)}
                      </span>
                    </CopyableCell>
                  )}
                  {visibleColumns.createdTime && (
                    <CopyableCell
                      value={
                        item.createdTime ? formatFileTime(item.createdTime, effectiveTimezone) : '—'
                      }
                      label="Created time"
                    >
                      <span className="text-muted-foreground text-sm">
                        {item.createdTime
                          ? formatFileTime(item.createdTime, effectiveTimezone)
                          : '—'}
                      </span>
                    </CopyableCell>
                  )}
                  <TableCell onClick={e => e.stopPropagation()}>{renderContent(item)}</TableCell>
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

export default DriveDataView
