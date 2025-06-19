"use client";

import React from 'react';
import { DriveFile, DriveFolder } from '@/lib/google-drive/types';
import { Card, CardContent } from "@/components/ui/card";
import { FileIcon } from '@/components/file-icon';
import { formatFileSize, formatDate } from '@/lib/google-drive/utils';
import { FileThumbnailPreview } from '@/components/ui/file-thumbnail-preview';
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  MoreVertical,
  Download,
  Share,
  Edit,
  Trash2,
  Eye,
  Move,
  Copy,
  Folder,
  Star
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DriveContentAreaProps {
  files: DriveFile[];
  folders: DriveFolder[];
  viewMode: 'grid' | 'table';
  selectedItems: Set<string>;
  onItemSelect: (itemId: string, isSelected: boolean) => void;
  onItemDoubleClick: (item: DriveFile | DriveFolder) => void;
  onItemAction: (action: string, item: DriveFile | DriveFolder) => void;
  isLoading?: boolean;
  className?: string;
}

export function DriveContentArea({
  files,
  folders,
  viewMode,
  selectedItems,
  onItemSelect,
  onItemDoubleClick,
  onItemAction,
  isLoading = false,
  className
}: DriveContentAreaProps) {
  
  const allItems = [...folders, ...files];
  const isAllSelected = allItems.length > 0 && allItems.every(item => selectedItems.has(item.id));
  const isIndeterminate = allItems.some(item => selectedItems.has(item.id)) && !isAllSelected;

  const handleSelectAll = (checked: boolean) => {
    allItems.forEach(item => {
      onItemSelect(item.id, checked);
    });
  };

  // Debug logging
  console.log('DriveContentArea render:', {
    files: files.length,
    folders: folders.length,
    isLoading,
    allItems: allItems.length
  });

  if (isLoading) {
    return (
      <div className={cn("p-6", className)}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-8 w-8 bg-muted rounded mb-2" />
                <div className="h-4 bg-muted rounded mb-1" />
                <div className="h-3 bg-muted rounded w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (allItems.length === 0 && !isLoading) {
    return (
      <div className={cn("flex items-center justify-center h-64", className)}>
        <div className="text-center">
          <Folder className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No files found</h3>
          <p className="text-muted-foreground">This folder is empty or no files match your filters.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("p-6", className)}>
      {viewMode === 'grid' ? (
        <GridView
          items={allItems}
          selectedItems={selectedItems}
          onItemSelect={onItemSelect}
          onItemDoubleClick={onItemDoubleClick}
          onItemAction={onItemAction}
        />
      ) : (
        <TableView
          items={allItems}
          selectedItems={selectedItems}
          onItemSelect={onItemSelect}
          onItemDoubleClick={onItemDoubleClick}
          onItemAction={onItemAction}
          isAllSelected={isAllSelected}
          isIndeterminate={isIndeterminate}
          onSelectAll={handleSelectAll}
        />
      )}
    </div>
  );
}

// Grid View Component
function GridView({
  items,
  selectedItems,
  onItemSelect,
  onItemDoubleClick,
  onItemAction
}: {
  items: (DriveFile | DriveFolder)[];
  selectedItems: Set<string>;
  onItemSelect: (itemId: string, isSelected: boolean) => void;
  onItemDoubleClick: (item: DriveFile | DriveFolder) => void;
  onItemAction: (action: string, item: DriveFile | DriveFolder) => void;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-4">
      {items.map((item) => (
        <ItemCard
          key={item.id}
          item={item}
          isSelected={selectedItems.has(item.id)}
          onSelect={(isSelected) => onItemSelect(item.id, isSelected)}
          onDoubleClick={() => onItemDoubleClick(item)}
          onAction={(action) => onItemAction(action, item)}
        />
      ))}
    </div>
  );
}

// Table View Component
function TableView({
  items,
  selectedItems,
  onItemSelect,
  onItemDoubleClick,
  onItemAction,
  isAllSelected,
  isIndeterminate,
  onSelectAll
}: {
  items: (DriveFile | DriveFolder)[];
  selectedItems: Set<string>;
  onItemSelect: (itemId: string, isSelected: boolean) => void;
  onItemDoubleClick: (item: DriveFile | DriveFolder) => void;
  onItemAction: (action: string, item: DriveFile | DriveFolder) => void;
  isAllSelected: boolean;
  isIndeterminate: boolean;
  onSelectAll: (checked: boolean) => void;
}) {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={isAllSelected}
                indeterminate={isIndeterminate}
                onCheckedChange={onSelectAll}
              />
            </TableHead>
            <TableHead>Name</TableHead>
            <TableHead className="hidden md:table-cell">Owner</TableHead>
            <TableHead className="hidden lg:table-cell">Modified</TableHead>
            <TableHead className="hidden xl:table-cell">Size</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow 
              key={item.id}
              className={cn(
                "cursor-pointer hover:bg-muted/50",
                selectedItems.has(item.id) && "bg-muted/30"
              )}
              onDoubleClick={() => onItemDoubleClick(item)}
            >
              <TableCell>
                <Checkbox
                  checked={selectedItems.has(item.id)}
                  onCheckedChange={(checked) => onItemSelect(item.id, !!checked)}
                />
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-3">
                  {'mimeType' in item ? (
                    <FileThumbnailPreview
                      thumbnailLink={item.thumbnailLink}
                      fileName={item.name}
                      mimeType={item.mimeType}
                      className="flex-shrink-0"
                    >
                      <FileIcon mimeType={item.mimeType} className="h-5 w-5" />
                    </FileThumbnailPreview>
                  ) : (
                    <Folder className="h-5 w-5 text-blue-500 flex-shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{item.name}</p>
                    {'mimeType' in item && (
                      <p className="text-sm text-muted-foreground truncate">
                        {item.mimeType?.split('/')[1]?.toUpperCase() || 'FILE'}
                      </p>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <div className="text-sm">
                  {item.owners?.[0]?.displayName || 'Unknown'}
                </div>
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                <div className="text-sm text-muted-foreground">
                  {formatDate(item.modifiedTime)}
                </div>
              </TableCell>
              <TableCell className="hidden xl:table-cell">
                <div className="text-sm text-muted-foreground">
                  {'size' in item ? formatFileSize(item.size) : '—'}
                </div>
              </TableCell>
              <TableCell>
                <ItemActions item={item} onAction={onItemAction} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// Item Card Component (for grid view)
function ItemCard({
  item,
  isSelected,
  onSelect,
  onDoubleClick,
  onAction
}: {
  item: DriveFile | DriveFolder;
  isSelected: boolean;
  onSelect: (isSelected: boolean) => void;
  onDoubleClick: () => void;
  onAction: (action: string) => void;
}) {
  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all hover:shadow-md group",
        isSelected && "ring-2 ring-primary bg-muted/30"
      )}
      onDoubleClick={onDoubleClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {'mimeType' in item ? (
              <FileThumbnailPreview
                thumbnailLink={item.thumbnailLink}
                fileName={item.name}
                mimeType={item.mimeType}
                className="flex-shrink-0"
              >
                <FileIcon mimeType={item.mimeType} className="h-8 w-8" />
              </FileThumbnailPreview>
            ) : (
              <Folder className="h-8 w-8 text-blue-500 flex-shrink-0" />
            )}
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              checked={isSelected}
              onCheckedChange={onSelect}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            />
            <ItemActions item={item} onAction={onAction} />
          </div>
        </div>
        
        <div className="space-y-1">
          <h4 className="font-medium truncate" title={item.name}>
            {item.name}
          </h4>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{formatDate(item.modifiedTime)}</span>
            {'size' in item && (
              <span>{formatFileSize(item.size)}</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Item Actions Dropdown
function ItemActions({
  item,
  onAction
}: {
  item: DriveFile | DriveFolder;
  onAction: (action: string) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onAction('preview')}>
          <Eye className="h-4 w-4 mr-2" />
          Preview
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onAction('download')}>
          <Download className="h-4 w-4 mr-2" />
          Download
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onAction('share')}>
          <Share className="h-4 w-4 mr-2" />
          Share
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onAction('rename')}>
          <Edit className="h-4 w-4 mr-2" />
          Rename
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onAction('move')}>
          <Move className="h-4 w-4 mr-2" />
          Move
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onAction('copy')}>
          <Copy className="h-4 w-4 mr-2" />
          Make a copy
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onAction('star')}>
          <Star className="h-4 w-4 mr-2" />
          Add to starred
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={() => onAction('delete')} 
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Move to trash
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}