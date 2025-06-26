'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'

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
  BottomSheetFooter,
} from '@/components/ui/bottom-sheet'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { useIsMobile } from '@/lib/hooks/use-mobile'
import { cn } from '@/lib/utils'

interface BulkDeleteDialogProps {
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

function BulkDeleteDialog({
  isOpen,
  onClose,
  onConfirm,
  selectedItems,
}: BulkDeleteDialogProps) {
  const [confirmationText, setConfirmationText] = useState('')
  const [acknowledgeWarning, setAcknowledgeWarning] = useState(false)
  const isMobile = useIsMobile()

  const isConfirmationValid =
    confirmationText.trim() === 'CONFIRM DELETE' && acknowledgeWarning

  const handleConfirm = () => {
    if (isConfirmationValid) {
      onConfirm()
      handleClose()
    }
  }

  const handleClose = () => {
    setConfirmationText('')
    setAcknowledgeWarning(false)
    onClose()
  }

  const renderContent = () => (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="space-y-3 text-center">
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
            <Trash2 className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-red-600 dark:text-red-400">
            Permanent Delete
          </h3>
          <p className="text-muted-foreground text-sm">
            DANGER: This action cannot be undone
          </p>
        </div>
      </div>

      {/* File Count Badge */}
      <div className="text-center">
        <Badge variant="destructive" className="px-3 py-1">
          {selectedItems.length} item{selectedItems.length > 1 ? 's' : ''}{' '}
          selected
        </Badge>
      </div>

      {/* Selected Files Preview */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-red-600 dark:text-red-400">
          Items to be permanently deleted
        </Label>
        <div className="max-h-32 space-y-1 overflow-y-auto rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950/20">
          {selectedItems.slice(0, 5).map((item) => (
            <div key={item.id} className="flex items-center gap-2 text-sm">
              <Trash2 className="h-4 w-4 flex-shrink-0 text-red-500" />
              <span className="truncate" title={item.name}>
                {item.name}
              </span>
            </div>
          ))}
          {selectedItems.length > 5 && (
            <div className="text-center text-xs text-red-700 italic dark:text-red-300">
              and {selectedItems.length - 5} more items...
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Requirements */}
      <div className="space-y-4">
        <div className="space-y-3">
          <Label className="text-sm font-medium">
            Type <span className="font-mono text-red-600">CONFIRM DELETE</span>{' '}
            to proceed
          </Label>
          <Input
            type="text"
            value={confirmationText}
            onChange={(e) => setConfirmationText(e.target.value)}
            placeholder="Type CONFIRM DELETE"
            className="font-mono"
          />
        </div>

        <div className="flex items-start space-x-2">
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
            className="cursor-pointer text-sm leading-relaxed"
          >
            I understand that this action will{' '}
            <span className="font-semibold text-red-600 dark:text-red-400">
              permanently delete
            </span>{' '}
            all selected items and{' '}
            <span className="font-semibold">cannot be reversed</span>.
          </Label>
        </div>
      </div>

      {/* Final Alert */}
      <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950/20">
        <div className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-red-500">
          <div className="h-1.5 w-1.5 rounded-full bg-white" />
        </div>
        <div className="text-sm text-red-800 dark:text-red-200">
          <span className="font-semibold">Final warning:</span> This action will
          permanently delete all selected items and cannot be reversed.
        </div>
      </div>
    </div>
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
                  Bulk Permanent Delete Operation
                </div>
              </div>
            </BottomSheetTitle>
          </BottomSheetHeader>

          <div className="flex-1 overflow-y-auto px-4 pb-4">
            {renderContent()}
          </div>

          <BottomSheetFooter className={cn('grid gap-4')}>
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
            <Button
              variant="outline"
              onClick={handleClose}
              className={cn('touch-target min-h-[44px] active:scale-95')}
            >
              Cancel
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
                Bulk Permanent Delete Operation
              </div>
            </div>
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-4 pt-2">
            {renderContent()}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
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
          <AlertDialogCancel className="w-full sm:w-auto">
            Cancel
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export { BulkDeleteDialog }
export default BulkDeleteDialog
