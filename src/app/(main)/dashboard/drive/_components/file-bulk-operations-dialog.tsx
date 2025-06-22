"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  BottomSheet, 
  BottomSheetContent, 
  BottomSheetHeader, 
  BottomSheetTitle, 
  BottomSheetDescription,
  BottomSheetFooter 
} from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useIsMobile } from "@/hooks/use-mobile";
import { getTouchButtonClasses } from "@/lib/mobile-optimization";
import { 
  Trash2, 
  Download, 
  Share, 
  Move, 
  Copy, 
  Edit,
  FolderOpen 
} from "lucide-react";

interface FileBulkOperationsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedItems: Array<{
    id: string;
    name: string;
    type: 'file' | 'folder';
  }>;
  onBulkDelete: () => void;
  onBulkDownload: () => void;
  onBulkShare: () => void;
  onBulkMove: () => void;
  onBulkCopy: () => void;
  onBulkRename: () => void;
}

export function FileBulkOperationsDialog({
  isOpen,
  onClose,
  selectedItems,
  onBulkDelete,
  onBulkDownload,
  onBulkShare,
  onBulkMove,
  onBulkCopy,
  onBulkRename
}: FileBulkOperationsDialogProps) {
  const isMobile = useIsMobile();
  const fileCount = selectedItems.filter(item => item.type === 'file').length;
  const folderCount = selectedItems.filter(item => item.type === 'folder').length;

  const operations = [
    {
      icon: Download,
      label: "Download",
      description: "Download selected items",
      action: onBulkDownload,
      variant: "default" as const
    },
    {
      icon: Share,
      label: "Share",
      description: "Share selected items",
      action: onBulkShare,
      variant: "default" as const
    },
    {
      icon: Move,
      label: "Move",
      description: "Move to another folder",
      action: onBulkMove,
      variant: "default" as const
    },
    {
      icon: Copy,
      label: "Copy",
      description: "Create copies",
      action: onBulkCopy,
      variant: "default" as const
    },
    {
      icon: Edit,
      label: "Rename",
      description: "Bulk rename with patterns",
      action: onBulkRename,
      variant: "default" as const
    },
    {
      icon: Trash2,
      label: "Delete",
      description: "Move to trash",
      action: onBulkDelete,
      variant: "destructive" as const
    }
  ];

  const renderContent = () => (
    <>
      <div className="flex items-center gap-2 mb-4">
        <Badge variant="secondary">
          {selectedItems.length} items selected
        </Badge>
        {fileCount > 0 && (
          <Badge variant="outline">
            {fileCount} file{fileCount !== 1 ? 's' : ''}
          </Badge>
        )}
        {folderCount > 0 && (
          <Badge variant="outline">
            <FolderOpen className="h-3 w-3 mr-1" />
            {folderCount} folder{folderCount !== 1 ? 's' : ''}
          </Badge>
        )}
      </div>

      <div className="grid gap-2">
        {operations.map((operation) => {
          const Icon = operation.icon;
          return (
            <Button
              key={operation.label}
              variant={operation.variant}
              className={`${getTouchButtonClasses('default')} justify-start h-auto p-3`}
              onClick={() => {
                operation.action();
                onClose();
              }}
            >
              <Icon className="h-4 w-4 mr-3" />
              <div className="text-left">
                <div className="font-medium">{operation.label}</div>
                <div className="text-xs text-muted-foreground">
                  {operation.description}
                </div>
              </div>
            </Button>
          );
        })}
      </div>
    </>
  );

  if (isMobile) {
    return (
      <BottomSheet open={isOpen} onOpenChange={onClose}>
        <BottomSheetContent>
          <BottomSheetHeader>
            <BottomSheetTitle>Bulk Operations</BottomSheetTitle>
            <BottomSheetDescription>
              Choose an action for the selected items
            </BottomSheetDescription>
          </BottomSheetHeader>
          <div className="px-4 pb-4">
            {renderContent()}
          </div>
        </BottomSheetContent>
      </BottomSheet>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Bulk Operations</DialogTitle>
          <DialogDescription>
            Choose an action for the selected items
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          {renderContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
}