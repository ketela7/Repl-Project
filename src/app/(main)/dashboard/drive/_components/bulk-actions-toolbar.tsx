"use client";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Download, 
  Trash2, 
  Move, 
  Copy, 
  X,
  CheckSquare,
  Square,
  MoreHorizontal,
  MousePointer,
  FileDown,
  Edit3,
  RotateCcw,
  ShieldX
} from "lucide-react";

interface BulkActionsToolbarProps {
  selectedCount: number;
  totalCount: number;
  isSelectMode: boolean;
  isAllSelected: boolean;
  isInTrash?: boolean;
  bulkOperationProgress: {
    isRunning: boolean;
    current: number;
    total: number;
    operation: string;
  };
  onToggleSelectMode: () => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onBulkDownload: () => void;
  onBulkDelete: () => void;
  onBulkMove: () => void;
  onBulkCopy: () => void;
  onBulkExport: () => void;
  onBulkRename: () => void;
  onBulkRestore?: () => void;
  onBulkPermanentDelete?: () => void;
}

export function BulkActionsToolbar({
  selectedCount,
  totalCount,
  isSelectMode,
  isAllSelected,
  isInTrash = false,
  bulkOperationProgress,
  onToggleSelectMode,
  onSelectAll,
  onDeselectAll,
  onBulkDownload,
  onBulkDelete,
  onBulkMove,
  onBulkCopy,
  onBulkExport,
  onBulkRename,
  onBulkRestore,
  onBulkPermanentDelete
}: BulkActionsToolbarProps) {
  if (bulkOperationProgress.isRunning) {
    return (
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex items-center space-x-3 min-w-0">
          <div className="text-sm font-semibold text-blue-900 dark:text-blue-100 truncate">
            {bulkOperationProgress.operation}
          </div>
          <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 whitespace-nowrap">
            {bulkOperationProgress.current} of {bulkOperationProgress.total}
          </Badge>
        </div>
        <div className="flex-1 w-full sm:max-w-xs">
          <Progress 
            value={(bulkOperationProgress.current / bulkOperationProgress.total) * 100} 
            className="h-2 bg-blue-100 dark:bg-blue-900"
          />
        </div>
        <div className="text-sm font-medium text-blue-700 dark:text-blue-300 whitespace-nowrap">
          {Math.round((bulkOperationProgress.current / bulkOperationProgress.total) * 100)}%
        </div>
      </div>
    );
  }

  if (!isSelectMode) {
    return (
      <div className="fixed bottom-6 left-6 z-40">
        <Button 
          variant="default" 
          size="lg" 
          onClick={onToggleSelectMode}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-lg rounded-full h-14 w-14 p-0"
          title="Start bulk selection"
        >
          <MousePointer className="h-5 w-5" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 left-6 z-40 flex flex-col items-start gap-3">
      {/* Selection Info Badge */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-full px-4 py-2 shadow-lg">
        <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
          {selectedCount} of {totalCount} selected
        </Badge>
      </div>

      {/* Floating Action Buttons */}
      <div className="flex items-center gap-3">
        {/* Exit Selection Mode Button */}
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onToggleSelectMode}
          className="bg-white dark:bg-gray-900 border-red-200 dark:border-red-700 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 shadow-lg rounded-full h-12 w-12 p-0"
          title="Exit selection mode"
        >
          <X className="h-5 w-5" />
        </Button>

        {/* Bulk Actions Menu */}
        {selectedCount > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="default" 
                size="lg" 
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg rounded-full h-14 w-14 p-0"
                title="Bulk Actions"
              >
                <MoreHorizontal className="h-6 w-6" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
              {!isInTrash ? (
                <>
                  {/* File Operations */}
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    File Operations
                  </div>
                  <DropdownMenuItem onClick={onBulkDownload} className="cursor-pointer">
                    <Download className="h-4 w-4 mr-2" />
                    Download Files
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onBulkExport} className="cursor-pointer">
                    <FileDown className="h-4 w-4 mr-2" />
                    Export As...
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator />
                  
                  {/* Organization */}
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Organization
                  </div>
                  <DropdownMenuItem onClick={onBulkRename} className="cursor-pointer">
                    <Edit3 className="h-4 w-4 mr-2" />
                    Bulk Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onBulkMove} className="cursor-pointer">
                    <Move className="h-4 w-4 mr-2" />
                    Move Items
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onBulkCopy} className="cursor-pointer">
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Items
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator />
                  
                  {/* Destructive Actions */}
                  <div className="px-2 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider">
                    Danger Zone
                  </div>
                  <DropdownMenuItem onClick={onBulkDelete} className="cursor-pointer text-orange-600 dark:text-orange-400">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Move to Trash
                  </DropdownMenuItem>
                  {onBulkPermanentDelete && (
                    <DropdownMenuItem onClick={onBulkPermanentDelete} className="cursor-pointer text-red-600 dark:text-red-400 font-medium">
                      <ShieldX className="h-4 w-4 mr-2" />
                      Permanently Delete
                    </DropdownMenuItem>
                  )}
                </>
              ) : (
                <>
                  {/* Trash Operations */}
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Trash Operations
                  </div>
                  {onBulkRestore && (
                    <DropdownMenuItem onClick={onBulkRestore} className="cursor-pointer text-green-600 dark:text-green-400">
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Restore Items
                    </DropdownMenuItem>
                  )}
                  
                  <DropdownMenuSeparator />
                  
                  {/* Destructive Actions */}
                  <div className="px-2 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider">
                    ⚠️ Danger Zone
                  </div>
                  {onBulkPermanentDelete && (
                    <DropdownMenuItem onClick={onBulkPermanentDelete} className="cursor-pointer text-red-600 dark:text-red-400 font-medium">
                      <ShieldX className="h-4 w-4 mr-2" />
                      Permanently Delete
                    </DropdownMenuItem>
                  )}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Select All/None Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={isAllSelected ? onDeselectAll : onSelectAll}
          className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 shadow-lg rounded-full h-12 w-12 p-0"
          title={isAllSelected ? 'Deselect All' : 'Select All'}
        >
          {isAllSelected ? (
            <CheckSquare className="h-5 w-5" />
          ) : (
            <Square className="h-5 w-5" />
          )}
        </Button>
      </div>
    </div>
  );
}