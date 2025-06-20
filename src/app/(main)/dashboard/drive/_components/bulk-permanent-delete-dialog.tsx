"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  BottomSheet, 
  BottomSheetContent, 
  BottomSheetHeader, 
  BottomSheetTitle, 
  BottomSheetDescription,
  BottomSheetFooter 
} from "@/components/ui/bottom-sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useIsMobile } from "@/hooks/use-mobile";
import { 
  Trash2, 
  AlertTriangle, 
  Shield,
  Clock
} from "lucide-react";

interface BulkPermanentDeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  selectedItems: Array<{
    id: string;
    name: string;
    type: 'file' | 'folder';
  }>;
}

export function BulkPermanentDeleteDialog({
  isOpen,
  onClose,
  onConfirm,
  selectedItems
}: BulkPermanentDeleteDialogProps) {
  const [confirmationText, setConfirmationText] = useState('');
  const [acknowledgeWarning, setAcknowledgeWarning] = useState(false);
  const isMobile = useIsMobile();
  
  const fileCount = selectedItems.filter(item => item.type === 'file').length;
  const folderCount = selectedItems.filter(item => item.type === 'folder').length;
  
  const isConfirmationValid = 
    confirmationText.toLowerCase() === 'permanently delete' && 
    acknowledgeWarning;

  const handleConfirm = () => {
    if (isConfirmationValid) {
      onConfirm();
      setConfirmationText('');
      setAcknowledgeWarning(false);
    }
  };

  const handleClose = () => {
    setConfirmationText('');
    setAcknowledgeWarning(false);
    onClose();
  };

  const renderContent = () => (
    <>
      <div className="space-y-4 pt-2">
        <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border-2 border-red-200 dark:border-red-800">
          <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-2">
            <div className="text-base font-semibold text-red-800 dark:text-red-200">
              ⚠️ DANGER: Permanent Deletion
            </div>
            <div className="text-sm text-red-700 dark:text-red-300">
              You are about to permanently delete <span className="font-bold">{selectedItems.length}</span> item{selectedItems.length > 1 ? 's' : ''}. 
              These items will be removed forever and cannot be recovered.
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {fileCount > 0 && (
            <Badge variant="destructive" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100">
              {fileCount} file{fileCount > 1 ? 's' : ''}
            </Badge>
          )}
          {folderCount > 0 && (
            <Badge variant="destructive" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100">
              {folderCount} folder{folderCount > 1 ? 's' : ''} + contents
            </Badge>
          )}
        </div>

        {selectedItems.length <= 5 ? (
          <div className="space-y-2">
            <div className="text-sm font-semibold">Items to be permanently deleted:</div>
            <div className="max-h-32 overflow-y-auto rounded-md bg-slate-50 dark:bg-slate-900/50 p-3 border-l-4 border-red-500">
              <ul className="text-sm space-y-1">
                {selectedItems.map((item) => (
                  <li key={item.id} className="flex items-center gap-2 truncate">
                    <Trash2 className="h-3 w-3 text-red-500 flex-shrink-0" />
                    <span className="truncate font-medium">{item.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="text-sm font-semibold">Preview (first 3 items):</div>
            <div className="rounded-md bg-slate-50 dark:bg-slate-900/50 p-3 border-l-4 border-red-500">
              <ul className="text-sm space-y-1">
                {selectedItems.slice(0, 3).map((item) => (
                  <li key={item.id} className="flex items-center gap-2 truncate">
                    <Trash2 className="h-3 w-3 text-red-500 flex-shrink-0" />
                    <span className="truncate font-medium">{item.name}</span>
                  </li>
                ))}
                <li className="flex items-center gap-2 text-muted-foreground/70 italic">
                  <Trash2 className="h-3 w-3 text-red-400 flex-shrink-0" />
                  and {selectedItems.length - 3} more items...
                </li>
              </ul>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
            <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800 dark:text-amber-200">
              <div className="font-semibold mb-1">What happens next:</div>
              <ul className="space-y-1 text-xs">
                <li>• Items will be removed from Google Drive immediately</li>
                <li>• No backup or recovery option will be available</li>
                <li>• Shared links will stop working permanently</li>
                <li>• Folder deletion includes all contents recursively</li>
              </ul>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="acknowledge-warning"
                checked={acknowledgeWarning}
                onCheckedChange={setAcknowledgeWarning}
                className="mt-1"
              />
              <Label
                htmlFor="acknowledge-warning"
                className="text-sm font-medium cursor-pointer leading-relaxed"
              >
                I understand this action cannot be undone and all selected items will be permanently deleted from Google Drive.
              </Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmation-input" className="text-sm font-semibold flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Type "permanently delete" to confirm:
              </Label>
              <Input
                id="confirmation-input"
                type="text"
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value)}
                placeholder="Type: permanently delete"
                className="font-mono"
                disabled={!acknowledgeWarning}
              />
              {confirmationText && confirmationText.toLowerCase() !== 'permanently delete' && (
                <div className="text-xs text-red-600 dark:text-red-400">
                  Please type "permanently delete" exactly as shown
                </div>
              )}
            </div>
          </div>

          <div className="flex items-start gap-2 rounded-lg bg-red-50 dark:bg-red-950/20 p-3 border border-red-200 dark:border-red-800">
            <div className="h-4 w-4 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0 mt-0.5">
              <div className="h-1.5 w-1.5 rounded-full bg-white" />
            </div>
            <div className="text-sm text-red-800 dark:text-red-200">
              <span className="font-semibold">Final warning:</span> This action will permanently delete all selected items and cannot be reversed.
            </div>
          </div>
        </div>
      </div>
    </>
  );

  if (isMobile) {
    return (
      <BottomSheet open={isOpen} onOpenChange={handleClose}>
        <BottomSheetContent className="max-h-[95vh]">
          <BottomSheetHeader className="pb-4">
            <BottomSheetTitle className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
                <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <div className="text-lg font-semibold text-red-600 dark:text-red-400">
                  Permanent Delete
                </div>
                <div className="text-sm font-normal text-muted-foreground">
                  This action cannot be undone
                </div>
              </div>
            </BottomSheetTitle>
          </BottomSheetHeader>

          <div className="px-4 pb-4 overflow-y-auto flex-1">
            {renderContent()}
          </div>

          <BottomSheetFooter className="flex-row gap-2">
            <Button variant="outline" onClick={handleClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleConfirm}
              disabled={!isConfirmationValid}
              className="flex-1 bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 dark:bg-red-700 dark:hover:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isConfirmationValid ? (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Permanently Delete
                </>
              ) : (
                'Complete Requirements Above'
              )}
            </Button>
          </BottomSheetFooter>
        </BottomSheetContent>
      </BottomSheet>
    );
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={handleClose}>
      <AlertDialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
              <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <div className="text-lg font-semibold text-red-600 dark:text-red-400">
                Permanent Delete
              </div>
              <div className="text-sm font-normal text-muted-foreground">
                This action cannot be undone
              </div>
            </div>
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-4 pt-2">
            {renderContent()}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel className="w-full sm:w-auto">Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleConfirm}
            disabled={!isConfirmationValid}
            className="w-full sm:w-auto bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 dark:bg-red-700 dark:hover:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isConfirmationValid ? (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Permanently Delete
              </>
            ) : (
              'Complete Requirements Above'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}