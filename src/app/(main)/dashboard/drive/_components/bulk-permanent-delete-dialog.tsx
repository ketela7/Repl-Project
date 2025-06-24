'use client'

import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetHeader,
  BottomSheetTitle,
  BottomSheetDescription,
  BottomSheetFooter,
} from '@/components/ui/bottom-sheet'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { useIsMobile } from '@/hooks/use-mobile'
import { Trash2, AlertTriangle, Shield, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BulkPermanentDeleteDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  selectedItems: Array<{
    id: string
    name: string
    type: 'file' | 'folder'
    mimeType?: string
  }>
}

export function BulkPermanentDeleteDialog({
  isOpen,
  onClose,
  onConfirm,
  selectedItems,
}: BulkPermanentDeleteDialogProps) {
  const [confirmationText, setConfirmationText] = useState('')
  const [acknowledgeWarning, setAcknowledgeWarning] = useState(false)
  const isMobile = useIsMobile()

  const fileCount = selectedItems.filter((item) => item.type === 'file').length
  const folderCount = selectedItems.filter(
    (item) => item.type === 'folder'
  ).length

  const isConfirmationValid =
    confirmationText.toLowerCase() === 'permanently delete' &&
    acknowledgeWarning

  const handleConfirm = () => {
    if (isConfirmationValid) {
      onConfirm()
      setConfirmationText('')
      setAcknowledgeWarning(false)
    }
  }

  const handleClose = () => {
    setConfirmationText('')
    setAcknowledgeWarning(false)
    onClose()
  }

  const renderContent = () => (
    <>
      <div className="space-y-4 pt-2">
        <div className="flex items-start gap-3 rounded-lg border-2 border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/20">
          <AlertTriangle className="mt-0.5 h-6 w-6 flex-shrink-0 text-red-600 dark:text-red-400" />
          <div className="space-y-2">
            <div className="text-base font-semibold text-red-800 dark:text-red-200">
              ⚠️ DANGER: Permanent Deletion
            </div>
            <div className="text-sm text-red-700 dark:text-red-300">
              You are about to permanently delete{' '}
              <span className="font-bold">{selectedItems.length}</span> item
              {selectedItems.length > 1 ? 's' : ''}. These items will be removed
              forever and cannot be recovered.
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {fileCount > 0 && (
            <Badge
              variant="destructive"
              className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
            >
              {fileCount} file{fileCount > 1 ? 's' : ''}
            </Badge>
          )}
          {folderCount > 0 && (
            <Badge
              variant="destructive"
              className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
            >
              {folderCount} folder{folderCount > 1 ? 's' : ''} + contents
            </Badge>
          )}
        </div>

        {selectedItems.length <= 5 ? (
          <div className="space-y-2">
            <div className="text-sm font-semibold">
              Items to be permanently deleted:
            </div>
            <div className="max-h-32 overflow-y-auto rounded-md border-l-4 border-red-500 bg-slate-50 p-3 dark:bg-slate-900/50">
              <ul className="space-y-1 text-sm">
                {selectedItems.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center gap-2 truncate"
                  >
                    <Trash2 className="h-3 w-3 flex-shrink-0 text-red-500" />
                    <span className="truncate font-medium">{item.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="text-sm font-semibold">
              Preview (first 3 items):
            </div>
            <div className="rounded-md border-l-4 border-red-500 bg-slate-50 p-3 dark:bg-slate-900/50">
              <ul className="space-y-1 text-sm">
                {selectedItems.slice(0, 3).map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center gap-2 truncate"
                  >
                    <Trash2 className="h-3 w-3 flex-shrink-0 text-red-500" />
                    <span className="truncate font-medium">{item.name}</span>
                  </li>
                ))}
                <li className="text-muted-foreground/70 flex items-center gap-2 italic">
                  <Trash2 className="h-3 w-3 flex-shrink-0 text-red-400" />
                  and {selectedItems.length - 3} more items...
                </li>
              </ul>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/20">
            <Clock className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
            <div className="text-sm text-amber-800 dark:text-amber-200">
              <div className="mb-1 font-semibold">What happens next:</div>
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
                onCheckedChange={(checked) =>
                  setAcknowledgeWarning(checked === true)
                }
                className="mt-1"
              />
              <Label
                htmlFor="acknowledge-warning"
                className="cursor-pointer text-sm leading-relaxed font-medium"
              >
                I understand this action cannot be undone and all selected items
                will be permanently deleted from Google Drive.
              </Label>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="confirmation-input"
                className="flex items-center gap-2 text-sm font-semibold"
              >
                <Shield className="h-4 w-4" />
                Type "permanently delete" to confirm:
              </Label>
              <Input
                id="confirmation-input"
                type="text"
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value)}
                className={`${cn('min-h-[44px]')} font-mono`}
                placeholder="Type: permanently delete"
                disabled={!acknowledgeWarning}
              />
              {confirmationText &&
                confirmationText.toLowerCase() !== 'permanently delete' && (
                  <div className="text-xs text-red-600 dark:text-red-400">
                    Please type "permanently delete" exactly as shown
                  </div>
                )}
            </div>
          </div>

          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950/20">
            <div className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-red-500">
              <div className="h-1.5 w-1.5 rounded-full bg-white" />
            </div>
            <div className="text-sm text-red-800 dark:text-red-200">
              <span className="font-semibold">Final warning:</span> This action
              will permanently delete all selected items and cannot be reversed.
            </div>
          </div>
        </div>
      </div>
    </>
  )

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
                <div className="text-muted-foreground text-sm font-normal">
                  This action cannot be undone
                </div>
              </div>
            </BottomSheetTitle>
          </BottomSheetHeader>

          <div className="flex-1 overflow-y-auto px-4 pb-4">
            {renderContent()}
          </div>

          <BottomSheetFooter className={cn('grid gap-4')}>
            <Button
              variant="outline"
              onClick={handleClose}
              className={cn('touch-target min-h-[44px] active:scale-95')}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!isConfirmationValid}
              className={`${cn('touch-target min-h-[44px] active:scale-95')} bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-red-700 dark:hover:bg-red-800`}
            >
              {isConfirmationValid ? (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Permanently Delete
                </>
              ) : (
                'Complete Requirements Above'
              )}
            </Button>
          </BottomSheetFooter>
        </BottomSheetContent>
      </BottomSheet>
    )
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={handleClose}>
      <AlertDialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
              <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <div className="text-lg font-semibold text-red-600 dark:text-red-400">
                Permanent Delete
              </div>
              <div className="text-muted-foreground text-sm font-normal">
                This action cannot be undone
              </div>
            </div>
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-4 pt-2">
            {renderContent()}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
          <AlertDialogCancel className="w-full sm:w-auto">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={!isConfirmationValid}
            className="w-full bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto dark:bg-red-700 dark:hover:bg-red-800"
          >
            {isConfirmationValid ? (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Permanently Delete
              </>
            ) : (
              'Complete Requirements Above'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
