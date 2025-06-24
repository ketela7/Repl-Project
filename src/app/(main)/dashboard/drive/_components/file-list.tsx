'use client'


import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table'
import { Checkbox } from '@/shared/components/ui/checkbox'
import { Button } from '@/shared/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu'
import { FileIcon } from '@/shared/components/file-icon'
import { FileThumbnailPreview } from '@/shared/components/ui/file-thumbnail-preview'
import { formatFileSize, formatDriveFileDate } from '@/lib/google-drive/utils'
import { formatFileTime } from '@/shared/utils'
import { useTimezoneContext } from '@/shared/components/timezone-provider'
import {
  MoreVertical,
  Download,
  Share2,
  Edit,
  Trash2,
  Eye,
  Move,
  Copy,
  Star,
} from 'lucide-react'
import { DriveFile, DriveFolder } from '@/lib/google-drive/types'

interface FileListProps {
  files: DriveFile[]
  folders: DriveFolder[]
  selectedItems: string[]
  isSelectMode: boolean
  visibleColumns: {
    name: boolean
    size: boolean
    owners: boolean
    mimeType: boolean
    createdTime: boolean
    modifiedTime: boolean
  }
  activeView: string
  sortBy: string
  sortOrder: 'asc' | 'desc'
  onSort: (field: string) => void
  onItemSelect: (id: string) => void
  onSelectAll: () => void
  onFileAction: (action: string, item: DriveFile | DriveFolder) => void
  toggleItemSelection: (id: string) => void
  handleFolderClick: (id: string) => void
  getFileActions: (file: DriveFile | DriveFolder, view: string) => any
}

export function FileList({
  files,
  folders,
  selectedItems,
  isSelectMode,
  visibleColumns,
  activeView,
  sortBy,
  sortOrder,
  onSort,
  onItemSelect,
  onSelectAll,
  onFileAction,
  toggleItemSelection,
  handleFolderClick,
  getFileActions,
}: FileListProps) {
  const { timezone } = useTimezoneContext()
  const allItems = [...folders, ...files]
  const allSelected =
    allItems.length > 0 && selectedItems.length === allItems.length
  const someSelected =
    selectedItems.length > 0 && selectedItems.length < allItems.length

  const SortableHeader = ({
    column,
    children,
  }: {
    column: string
    children: React.ReactNode
  }) => (
    <TableHead
      className="hover:bg-muted/50 cursor-pointer"
      onClick={() => onSort(column)}
    >
      <div className="flex items-center gap-1">
        {children}
        {sortBy === column && (
          <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
        )}
      </div>
    </TableHead>
  )

  const FileActions = ({ item }: { item: DriveFile | DriveFolder }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onFileAction('preview', item)}>
          <Eye className="mr-2 h-4 w-4" />
          Preview
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onFileAction('download', item)}>
          <Download className="mr-2 h-4 w-4" />
          Download
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onFileAction('share', item)}>
          <Share2 className="mr-2 h-4 w-4" />
          Share
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onFileAction('rename', item)}>
          <Edit className="mr-2 h-4 w-4" />
          Rename
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onFileAction('move', item)}>
          <Move className="mr-2 h-4 w-4" />
          Move
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onFileAction('copy', item)}>
          <Copy className="mr-2 h-4 w-4" />
          Copy
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onFileAction('star', item)}>
          <Star className="mr-2 h-4 w-4" />
          {item.starred ? 'Remove Star' : 'Add Star'}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onFileAction('delete', item)}
          className="text-destructive"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Move to Trash
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox checked={allSelected} onCheckedChange={onSelectAll} />
            </TableHead>
            <SortableHeader column="name">Name</SortableHeader>
            <SortableHeader column="size">Size</SortableHeader>
            <SortableHeader column="modifiedTime">Modified</SortableHeader>
            <SortableHeader column="owner">Owner</SortableHeader>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {allItems.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={6}
                className="text-muted-foreground py-8 text-center"
              >
                No files or folders found
              </TableCell>
            </TableRow>
          ) : (
            allItems.map((item) => (
              <TableRow
                key={item.id}
                className="hover:bg-muted/50 cursor-pointer"
                onClick={() => {
                  if (
                    'mimeType' in item &&
                    item.mimeType === 'application/vnd.google-apps.folder'
                  ) {
                    handleFolderClick(item.id)
                  } else {
                    onFileAction('preview', item)
                  }
                }}
              >
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selectedItems.includes(item.id)}
                    onCheckedChange={(checked) => toggleItemSelection(item.id)}
                  />
                </TableCell>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-3">
                    <FileThumbnailPreview
                      thumbnailLink={item.thumbnailLink}
                      fileName={item.name}
                      mimeType={item.mimeType}
                      modifiedTime={item.modifiedTime}
                    >
                      <FileIcon
                        mimeType={item.mimeType}
                        fileName={item.name}
                        className="h-5 w-5"
                      />
                    </FileThumbnailPreview>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{item.name}</div>
                      {'mimeType' in item &&
                        item.mimeType !==
                          'application/vnd.google-apps.folder' && (
                          <div className="text-muted-foreground truncate text-xs">
                            {item.mimeType.split('/').pop()?.toUpperCase()}
                          </div>
                        )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {'size' in item && item.size
                    ? formatFileSize(Number(item.size))
                    : '—'}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatFileTime(item.modifiedTime, timezone)}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {'ownedByMe' in item
                    ? item.ownedByMe
                      ? 'Me'
                      : item.owners?.[0]?.displayName || 'Unknown'
                    : 'Me'}
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <FileActions item={item} />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
