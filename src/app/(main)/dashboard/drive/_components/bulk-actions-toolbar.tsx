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
      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
        <div className="flex items-center space-x-3">
          <div className="text-sm font-medium">{bulkOperationProgress.operation}</div>
          <Badge variant="secondary">
            {bulkOperationProgress.current} of {bulkOperationProgress.total}
          </Badge>
        </div>
        <div className="flex-1 mx-4 max-w-xs">
          <Progress 
            value={(bulkOperationProgress.current / bulkOperationProgress.total) * 100} 
            className="h-2"
          />
        </div>
        <div className="text-sm text-muted-foreground">
          {Math.round((bulkOperationProgress.current / bulkOperationProgress.total) * 100)}%
        </div>
      </div>
    );
  }

  if (!isSelectMode) {
    return (
      <Button 
        variant="outline" 
        size="sm" 
        onClick={onToggleSelectMode}
        className="flex items-center gap-2"
      >
        <Square className="h-4 w-4" />
        Select
      </Button>
    );
  }

  return (
    <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg border border-primary/20">
      <div className="flex items-center space-x-3">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onToggleSelectMode}
          className="h-8 w-8 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={isAllSelected ? onDeselectAll : onSelectAll}
            className="flex items-center gap-2"
          >
            {isAllSelected ? (
              <CheckSquare className="h-4 w-4" />
            ) : (
              <Square className="h-4 w-4" />
            )}
            {isAllSelected ? 'Deselect All' : 'Select All'}
          </Button>
          
          <Badge variant="secondary">
            {selectedCount} of {totalCount} selected
          </Badge>
        </div>
      </div>

      {selectedCount > 0 && (
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onBulkDownload}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Download
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={onBulkMove}
            className="flex items-center gap-2"
          >
            <Move className="h-4 w-4" />
            Move
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={onBulkCopy}
            className="flex items-center gap-2"
          >
            <Copy className="h-4 w-4" />
            Copy
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={onBulkDelete}
            className="flex items-center gap-2 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      )}
    </div>
  );
}