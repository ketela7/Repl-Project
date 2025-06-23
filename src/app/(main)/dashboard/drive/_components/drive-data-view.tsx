"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FileIcon } from "@/components/file-icon";
import { DriveManagerSkeleton } from "./drive-manager-skeleton";
import { useTimezone } from "@/hooks/use-timezone";
import { formatFileTime } from "@/lib/timezone";
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
} from "lucide-react";
import type { DriveFile, DriveFolder } from "@/lib/google-drive/types";

type DriveItem = (DriveFile | DriveFolder) & { itemType?: 'file' | 'folder' };

interface DriveDataViewProps {
  items: DriveItem[];
  viewMode: 'grid' | 'table';
  isSelectMode: boolean;
  selectedItems: Set<string>;
  visibleColumns: {
    name: boolean;
    size: boolean;
    owners: boolean;
    mimeType: boolean;
    createdTime: boolean;
    modifiedTime: boolean;
  };
  sortConfig?: {
    key: string;
    direction: 'asc' | 'desc';
  } | null;
  onSelectItem: (id: string) => void;
  onFolderClick: (id: string) => void;
  onColumnsChange: (columns: any) => void;
  onItemAction: (action: string, item: DriveItem) => void;
  timezone?: string;
  loading?: boolean;
  loadingMore?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
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
  const { timezone: userTimezone } = useTimezone();
  const effectiveTimezone = timezone || userTimezone;
  
  const isFolder = (item: DriveItem): boolean => {
    return item.mimeType === 'application/vnd.google-apps.folder';
  };

  if (loading && items.length === 0) {
    return <DriveManagerSkeleton />;
  }

  return (
    <Card>
      <CardContent className="p-0">
        {items.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <div className="flex justify-center mb-4">
              <FileIcon mimeType="application/vnd.google-apps.folder" className="h-16 w-16" />
            </div>
            <h3 className="text-lg font-medium mb-2">
              No files found
            </h3>
            <p className="text-sm">
              Try adjusting your search terms or filters
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3 md:gap-4">
            {items.map((item) => (
              <div
                key={item.id}
                className={`border rounded-lg p-2 sm:p-3 md:p-4 hover:bg-accent cursor-pointer transition-colors relative ${
                  selectedItems.has(item.id) ? 'ring-2 ring-primary bg-primary/5' : ''
                }`}
                onClick={() => isSelectMode ? onSelectItem(item.id) : isFolder(item) ? onFolderClick(item.id) : onItemAction('preview', item)}
              >
                {isSelectMode && (
                  <div className="absolute top-2 left-2 z-10" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedItems.has(item.id)}
                      onCheckedChange={() => onSelectItem(item.id)}
                      className="bg-background !h-4 !w-4 !size-4"
                    />
                  </div>
                )}
                <div className="flex items-start justify-between mb-2">
                  <div className={`flex items-center ${isSelectMode ? 'ml-6' : ''}`}>
                    <FileIcon mimeType={item.mimeType} className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8" />
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="sm" className="h-6 w-6 sm:h-8 sm:w-8 p-0">
                        <MoreVertical className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenuItem onClick={() => onItemAction('preview', item)}>
                        <Eye className="h-4 w-4 mr-2" />
                        Preview
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onItemAction('download', item)}>
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onItemAction('rename', item)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onItemAction('move', item)}>
                        <Move className="h-4 w-4 mr-2" />
                        Move
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onItemAction('copy', item)}>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onItemAction('share', item)}>
                        <Share className="h-4 w-4 mr-2" />
                        Share
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onItemAction('delete', item)} className="text-destructive">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="flex flex-col min-h-0">
                  <h3 className="font-medium text-sm sm:text-base truncate mb-1" title={item.name}>
                    {item.name}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {formatFileTime(item.modifiedTime, effectiveTimezone)}
                  </p>
                </div>
              </div>
            ))}
            
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
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  {isSelectMode && (
                    <Checkbox
                      checked={selectedItems.has(item.id)}
                      onCheckedChange={() => onSelectItem(item.id)}
                    />
                  )}
                  <FileIcon mimeType={item.mimeType} className="h-8 w-8" />
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatFileTime(item.modifiedTime, effectiveTimezone)}
                    </p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onItemAction('preview', item)}>
                      <Eye className="h-4 w-4 mr-2" />
                      Preview
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onItemAction('download', item)}>
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onItemAction('rename', item)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onItemAction('move', item)}>
                      <Move className="h-4 w-4 mr-2" />
                      Move
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onItemAction('copy', item)}>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onItemAction('share', item)}>
                      <Share className="h-4 w-4 mr-2" />
                      Share
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onItemAction('delete', item)} className="text-destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
            
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
          </div>
        )}
      </CardContent>
    </Card>
  );
}