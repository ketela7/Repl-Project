"use client";

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  X, 
  Download, 
  Share, 
  Copy, 
  Move, 
  Trash2, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Play,
  Pause
} from "lucide-react";
import { 
  BulkOperationItem, 
  BulkOperationProgress, 
  BulkOperationType,
  getOperationPreview,
  bulkDownloadFiles,
  bulkShareFiles,
  bulkCopyFiles,
  bulkMoveFiles,
  bulkDeleteFiles
} from '@/lib/bulk-operations';
import { toast } from "sonner";

interface BulkOperationDialogProps {
  open: boolean;
  onClose: () => void;
  operation: BulkOperationType;
  items: BulkOperationItem[];
  operationParams?: any;
}

const OPERATION_ICONS = {
  download: Download,
  share: Share,
  copy: Copy,
  move: Move,
  delete: Trash2,
  rename: Copy,
  export: Download
};

const OPERATION_TITLES = {
  download: 'Bulk Download',
  share: 'Bulk Share',
  copy: 'Bulk Copy',
  move: 'Bulk Move',
  delete: 'Bulk Delete',
  rename: 'Bulk Rename',
  export: 'Bulk Export'
};

export function BulkOperationDialog({ 
  open, 
  onClose, 
  operation, 
  items, 
  operationParams 
}: BulkOperationDialogProps) {
  const [stage, setStage] = useState<'preview' | 'executing' | 'completed'>('preview');
  const [progress, setProgress] = useState<BulkOperationProgress | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setStage('preview');
      setProgress(null);
      setIsPaused(false);
    }
  }, [open]);

  const preview = getOperationPreview(items, operation);
  const OperationIcon = OPERATION_ICONS[operation];

  const formatDuration = (ms: number) => {
    const seconds = Math.ceil(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const executeOperation = async () => {
    if (preview.processableItems.length === 0) {
      toast.error('No items can be processed');
      return;
    }

    setStage('executing');

    try {
      let result: BulkOperationProgress;

      switch (operation) {
        case 'download':
          result = await bulkDownloadFiles(preview.processableItems, setProgress);
          break;
        case 'share':
          result = await bulkShareFiles(preview.processableItems, operationParams, setProgress);
          break;
        case 'copy':
          result = await bulkCopyFiles(preview.processableItems, operationParams, setProgress);
          break;
        case 'move':
          result = await bulkMoveFiles(preview.processableItems, operationParams, setProgress);
          break;
        case 'delete':
          result = await bulkDeleteFiles(preview.processableItems, operationParams?.permanent, setProgress);
          break;
        default:
          throw new Error(`Operation ${operation} not implemented`);
      }

      setProgress(result);
      setStage('completed');

      // Show completion toast
      const successCount = result.completed.length;
      const failCount = result.failed.length;
      const duration = formatDuration(result.timeElapsed);

      if (failCount === 0) {
        toast.success(`${OPERATION_TITLES[operation]} completed: ${successCount} items processed in ${duration}`);
      } else {
        toast.warning(`${OPERATION_TITLES[operation]} completed: ${successCount} successful, ${failCount} failed in ${duration}`);
      }

    } catch (error) {
      console.error('Bulk operation failed:', error);
      toast.error(`${OPERATION_TITLES[operation]} failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setStage('preview');
    }
  };

  const renderPreviewStage = () => (
    <div className="space-y-6">
      {/* Operation Summary */}
      <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
        <OperationIcon className="h-6 w-6 text-primary" />
        <div className="flex-1">
          <h3 className="font-medium">{OPERATION_TITLES[operation]}</h3>
          <p className="text-sm text-muted-foreground">
            {preview.processableItems.length} items will be processed
            {preview.skippedItems.length > 0 && `, ${preview.skippedItems.length} skipped`}
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm font-medium">Estimated time</div>
          <div className="text-lg font-bold text-primary">
            {formatDuration(preview.estimatedDuration)}
          </div>
        </div>
      </div>

      {/* Skip Reasons */}
      {Object.keys(preview.skipReasons).length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            Items that will be skipped
          </h4>
          <div className="space-y-2">
            {Object.entries(preview.skipReasons).map(([reason, skippedItems]) => (
              <div key={reason} className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-amber-800 dark:text-amber-200">
                    {reason}
                  </span>
                  <Badge variant="secondary">{skippedItems.length} items</Badge>
                </div>
                <ScrollArea className="max-h-20">
                  <div className="text-xs text-amber-700 dark:text-amber-300 space-y-1">
                    {skippedItems.map(item => (
                      <div key={item.id}>{item.name}</div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button 
          onClick={executeOperation} 
          disabled={preview.processableItems.length === 0}
          className="min-w-32"
        >
          <Play className="h-4 w-4 mr-2" />
          Start {OPERATION_TITLES[operation]}
        </Button>
      </div>
    </div>
  );

  const renderExecutingStage = () => (
    <div className="space-y-6">
      {/* Progress Header */}
      <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <OperationIcon className="h-6 w-6 text-blue-600" />
        <div className="flex-1">
          <h3 className="font-medium text-blue-900 dark:text-blue-100">
            {OPERATION_TITLES[operation]} in Progress
          </h3>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Processing {progress?.current || 0} of {progress?.total || 0} items
          </p>
        </div>
        {progress?.estimatedTimeRemaining && (
          <div className="text-right">
            <div className="text-xs text-blue-700 dark:text-blue-300">Time remaining</div>
            <div className="text-sm font-bold text-blue-900 dark:text-blue-100">
              {formatDuration(progress.estimatedTimeRemaining)}
            </div>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      {progress && (
        <div className="space-y-2">
          <Progress 
            value={(progress.current / progress.total) * 100} 
            className="h-3"
          />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{progress.current} / {progress.total} completed</span>
            <span>{Math.round((progress.current / progress.total) * 100)}%</span>
          </div>
        </div>
      )}

      {/* Live Results */}
      {progress && (progress.completed.length > 0 || progress.failed.length > 0) && (
        <div className="space-y-3">
          <h4 className="font-medium">Results</h4>
          <div className="grid grid-cols-2 gap-4">
            {progress.completed.length > 0 && (
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800 dark:text-green-200">
                    Successful ({progress.completed.length})
                  </span>
                </div>
              </div>
            )}
            {progress.failed.length > 0 && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-medium text-red-800 dark:text-red-200">
                    Failed ({progress.failed.length})
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cancel Button */}
      <div className="flex justify-end">
        <Button variant="outline" onClick={onClose}>
          <X className="h-4 w-4 mr-2" />
          Close
        </Button>
      </div>
    </div>
  );

  const renderCompletedStage = () => (
    <div className="space-y-6">
      {/* Completion Summary */}
      <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
        <CheckCircle className="h-6 w-6 text-green-600" />
        <div className="flex-1">
          <h3 className="font-medium text-green-900 dark:text-green-100">
            {OPERATION_TITLES[operation]} Completed
          </h3>
          <p className="text-sm text-green-700 dark:text-green-300">
            {progress?.completed.length || 0} successful, {progress?.failed.length || 0} failed
            {progress && ` • Completed in ${formatDuration(progress.timeElapsed)}`}
          </p>
        </div>
      </div>

      {/* Detailed Results */}
      {progress && (
        <div className="grid grid-cols-1 gap-4">
          {progress.completed.length > 0 && (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <h4 className="font-medium text-green-800 dark:text-green-200 mb-3">
                Successfully Processed ({progress.completed.length})
              </h4>
              <ScrollArea className="max-h-32">
                <div className="space-y-1 text-sm text-green-700 dark:text-green-300">
                  {progress.completed.map(result => (
                    <div key={result.item.id} className="flex justify-between">
                      <span>{result.item.name}</span>
                      {result.duration && (
                        <span className="text-xs">{result.duration}ms</span>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {progress.failed.length > 0 && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <h4 className="font-medium text-red-800 dark:text-red-200 mb-3">
                Failed to Process ({progress.failed.length})
              </h4>
              <ScrollArea className="max-h-32">
                <div className="space-y-2 text-sm text-red-700 dark:text-red-300">
                  {progress.failed.map(result => (
                    <div key={result.item.id}>
                      <div className="font-medium">{result.item.name}</div>
                      <div className="text-xs text-red-600 dark:text-red-400">
                        {result.error}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>
      )}

      {/* Close Button */}
      <div className="flex justify-end gap-3">
        <Button onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <OperationIcon className="h-5 w-5" />
            {OPERATION_TITLES[operation]}
            {stage === 'executing' && (
              <Badge variant="secondary" className="ml-2">
                In Progress
              </Badge>
            )}
            {stage === 'completed' && (
              <Badge variant="default" className="ml-2 bg-green-600">
                Completed
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          {stage === 'preview' && renderPreviewStage()}
          {stage === 'executing' && renderExecutingStage()}
          {stage === 'completed' && renderCompletedStage()}
        </div>
      </DialogContent>
    </Dialog>
  );
}