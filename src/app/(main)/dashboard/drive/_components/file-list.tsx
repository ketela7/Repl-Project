"use client";

import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FileIcon } from '@/components/file-icon';
import { formatFileSize, formatDriveFileDate } from '@/lib/google-drive/utils';
import { formatFileTime } from '@/lib/timezone';
import { useTimezoneContext } from '@/components/timezone-provider';
import { 
  MoreVertical,
  Download,
  Share2,
  Edit,
  Trash2,
  Eye,
  Move,
  Copy,
  Star
} from "lucide-react";
import { DriveFile, DriveFolder } from '@/lib/google-drive/types';

interface FileListProps {
  files: DriveFile[];
  folders: DriveFolder[];
  selectedItems: string[];
  onItemSelect: (id: string, checked: boolean) => void;
  onSelectAll: (checked: boolean) => void;
  onFileAction: (action: string, item: DriveFile | DriveFolder) => void;
  viewMode: 'list' | 'grid';
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSort: (column: string) => void;
}

export function FileList({
  files,
  folders,
  selectedItems,
  onItemSelect,
  onSelectAll,
  onFileAction,
  sortBy,
  sortOrder,
  onSort
}: FileListProps) {
  const { timezone } = useTimezoneContext();
  const allItems = [...folders, ...files];
  const allSelected = allItems.length > 0 && selectedItems.length === allItems.length;
  const someSelected = selectedItems.length > 0 && selectedItems.length < allItems.length;

  const SortableHeader = ({ column, children }: { column: string; children: React.ReactNode }) => (
    <TableHead 
      className="cursor-pointer hover:bg-muted/50"
      onClick={() => onSort(column)}
    >
      <div className="flex items-center gap-1">
        {children}
        {sortBy === column && (
          <span className="text-xs">
            {sortOrder === 'asc' ? '↑' : '↓'}
          </span>
        )}
      </div>
    </TableHead>
  );

  const FileActions = ({ item }: { item: DriveFile | DriveFolder }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm"
          className="h-8 w-8 p-0"
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onFileAction('preview', item)}>
          <Eye className="h-4 w-4 mr-2" />
          Preview
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onFileAction('download', item)}>
          <Download className="h-4 w-4 mr-2" />
          Download
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onFileAction('share', item)}>
          <Share2 className="h-4 w-4 mr-2" />
          Share
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onFileAction('rename', item)}>
          <Edit className="h-4 w-4 mr-2" />
          Rename
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onFileAction('move', item)}>
          <Move className="h-4 w-4 mr-2" />
          Move
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onFileAction('copy', item)}>
          <Copy className="h-4 w-4 mr-2" />
          Copy
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onFileAction('star', item)}>
          <Star className="h-4 w-4 mr-2" />
          {item.starred ? 'Remove Star' : 'Add Star'}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => onFileAction('delete', item)}
          className="text-destructive"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Move to Trash
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={allSelected}
                indeterminate={someSelected}
                onCheckedChange={onSelectAll}
              />
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
                className="text-center py-8 text-muted-foreground"
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
                  if ('mimeType' in item && item.mimeType === 'application/vnd.google-apps.folder') {
                    onFileAction('open', item);
                  } else {
                    onFileAction('preview', item);
                  }
                }}
              >
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selectedItems.includes(item.id)}
                    onCheckedChange={(checked) => onItemSelect(item.id, !!checked)}
                  />
                </TableCell>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-3">
                    <FileIcon 
                      mimeType={item.mimeType} 
                      fileName={item.name}
                      className="h-5 w-5"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{item.name}</div>
                      {'mimeType' in item && item.mimeType !== 'application/vnd.google-apps.folder' && (
                        <div className="text-xs text-muted-foreground truncate">
                          {item.mimeType.split('/').pop()?.toUpperCase()}
                        </div>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {'size' in item && item.size ? formatFileSize(Number(item.size)) : '—'}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatFileTime(item.modifiedTime, timezone)}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {'ownedByMe' in item ? (item.ownedByMe ? 'Me' : item.owners?.[0]?.displayName || 'Unknown') : 'Me'}
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
  );
}