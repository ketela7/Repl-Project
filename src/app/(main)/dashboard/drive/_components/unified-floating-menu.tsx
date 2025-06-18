"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
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
  Activity,
  Menu,
  Settings
} from "lucide-react";

interface UnifiedFloatingMenuProps {
  // Bulk Actions Props
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
  
  // Performance Monitor Props
  onShowPerformance: () => void;
}

export function UnifiedFloatingMenu({
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
  onBulkCopy,
  onShowPerformance
}: UnifiedFloatingMenuProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Show progress when bulk operation is running
  if (bulkOperationProgress.isRunning) {
    return (
      <div className="fixed bottom-6 right-6 z-40">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-lg max-w-xs">
          <div className="flex items-center space-x-3 mb-2">
            <div className="text-sm font-semibold text-blue-900 dark:text-blue-100">
              {bulkOperationProgress.operation}
            </div>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
              {bulkOperationProgress.current} of {bulkOperationProgress.total}
            </Badge>
          </div>
          <div className="w-full bg-blue-100 dark:bg-blue-900 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(bulkOperationProgress.current / bulkOperationProgress.total) * 100}%` }}
            />
          </div>
          <div className="text-sm font-medium text-blue-700 dark:text-blue-300 mt-1">
            {Math.round((bulkOperationProgress.current / bulkOperationProgress.total) * 100)}%
          </div>
        </div>
      </div>
    );
  }

  // When in select mode, show selection UI
  if (isSelectMode) {
    return (
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3">
        {/* Selection Info Badge */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-full px-4 py-2 shadow-lg">
          <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
            {selectedCount} of {totalCount} selected
          </Badge>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          {/* Exit Selection Mode */}
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
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={onBulkDownload} className="cursor-pointer">
                  <Download className="h-4 w-4 mr-2" />
                  Download Files
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onBulkMove} className="cursor-pointer">
                  <Move className="h-4 w-4 mr-2" />
                  Move Items
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onBulkCopy} className="cursor-pointer">
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Items
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onBulkDelete} className="cursor-pointer text-red-600 dark:text-red-400">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Items
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Select All/None */}
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

  // Default state - unified floating menu
  if (!isExpanded) {
    return (
      <div className="fixed bottom-6 right-6 z-40">
        <Button 
          variant="default" 
          size="lg" 
          onClick={() => setIsExpanded(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg rounded-full h-14 w-14 p-0"
          title="Open Actions Menu"
        >
          <Menu className="h-6 w-6" />
        </Button>
      </div>
    );
  }

  // Expanded state - show action options
  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3">
      {/* Close button */}
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => setIsExpanded(false)}
        className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 shadow-lg rounded-full h-10 w-10 p-0"
        title="Close menu"
      >
        <X className="h-4 w-4" />
      </Button>

      {/* Action buttons */}
      <div className="flex flex-col gap-3">
        {/* Performance Monitor */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            onShowPerformance();
            setIsExpanded(false);
          }}
          className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 shadow-lg rounded-full h-12 w-12 p-0"
          title="Performance Monitor"
        >
          <Activity className="h-5 w-5" />
        </Button>

        {/* Bulk Selection */}
        <Button
          variant="default"
          size="lg"
          onClick={() => {
            onToggleSelectMode();
            setIsExpanded(false);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg rounded-full h-14 w-14 p-0"
          title="Start Bulk Selection"
        >
          <MousePointer className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
}