"use client";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Download, 
  Trash2, 
  Move, 
  Copy, 
  X,
  CheckSquare,
  Square
} from "lucide-react";

interface BulkActionsToolbarProps {
  selectedCount: number;
  totalCount: number;
  isSelectMode: boolean;
  isAllSelected: boolean;
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
}

export function BulkActionsToolbar({
  selectedCount,
  totalCount,
  isSelectMode,
  isAllSelected,
  bulkOperationProgress,
  onToggleSelectMode,
  onSelectAll,
  onDeselectAll,
  onBulkDownload,
  onBulkDelete,
  onBulkMove,
  onBulkCopy
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
      <div className="flex items-center justify-start">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onToggleSelectMode}
          className="flex items-center gap-2 hover:bg-blue-50 hover:border-blue-300 dark:hover:bg-blue-950/20 dark:hover:border-blue-700 transition-colors"
        >
          <Square className="h-4 w-4" />
          <span className="hidden sm:inline">Select Items</span>
          <span className="sm:hidden">Select</span>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 p-4 bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-900/50 dark:to-gray-900/50 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
      <div className="flex items-center space-x-3 min-w-0 flex-1">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onToggleSelectMode}
          className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-colors"
          title="Exit selection mode"
        >
          <X className="h-4 w-4" />
        </Button>
        
        <div className="flex items-center space-x-3 min-w-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={isAllSelected ? onDeselectAll : onSelectAll}
            className="flex items-center gap-2 hover:bg-blue-100 hover:text-blue-700 dark:hover:bg-blue-900/20 dark:hover:text-blue-300 transition-colors"
          >
            {isAllSelected ? (
              <CheckSquare className="h-4 w-4" />
            ) : (
              <Square className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">
              {isAllSelected ? 'Deselect All' : 'Select All'}
            </span>
            <span className="sm:hidden">
              {isAllSelected ? 'None' : 'All'}
            </span>
          </Button>
          
          <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 whitespace-nowrap">
            {selectedCount} of {totalCount} selected
          </Badge>
        </div>
      </div>

      {selectedCount > 0 && (
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={onBulkDownload}
            className="flex items-center gap-2 hover:bg-green-50 hover:border-green-300 hover:text-green-700 dark:hover:bg-green-950/20 dark:hover:border-green-700 dark:hover:text-green-400 transition-colors"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Download</span>
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={onBulkMove}
            className="flex items-center gap-2 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 dark:hover:bg-blue-950/20 dark:hover:border-blue-700 dark:hover:text-blue-400 transition-colors"
          >
            <Move className="h-4 w-4" />
            <span className="hidden sm:inline">Move</span>
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={onBulkCopy}
            className="flex items-center gap-2 hover:bg-purple-50 hover:border-purple-300 hover:text-purple-700 dark:hover:bg-purple-950/20 dark:hover:border-purple-700 dark:hover:text-purple-400 transition-colors"
          >
            <Copy className="h-4 w-4" />
            <span className="hidden sm:inline">Copy</span>
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={onBulkDelete}
            className="flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 hover:text-red-700 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-950/20 dark:hover:border-red-700 dark:hover:text-red-300 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            <span className="hidden sm:inline">Delete</span>
          </Button>
        </div>
      )}
    </div>
  );
}