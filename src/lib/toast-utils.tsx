import { toast } from 'sonner'
import { X, Undo2, RotateCcw } from 'lucide-react'

interface ToastWithActionsOptions {
  message: string
  onClose?: () => void
  onUndo?: () => void
  undoText?: string
  duration?: number
}

/**
 * Custom toast with inline close and undo buttons
 */
export const toastWithActions = {
  success: ({
    message,
    onClose,
    onUndo,
    undoText = 'Undo',
    duration = 6000,
  }: ToastWithActionsOptions) => {
    return toast.success(message, {
      duration,
      action: onUndo
        ? {
            label: (
              <div className="flex items-center gap-2">
                <Undo2 className="h-3 w-3" />
                {undoText}
              </div>
            ),
            onClick: onUndo,
          }
        : undefined,
      cancel: {
        label: <X className="h-3 w-3" />,
        onClick: onClose,
      },
    })
  },

  error: ({
    message,
    onClose,
    onUndo,
    undoText = 'Retry',
    duration = 8000,
  }: ToastWithActionsOptions) => {
    return toast.error(message, {
      duration,
      action: onUndo
        ? {
            label: (
              <div className="flex items-center gap-2">
                <RotateCcw className="h-3 w-3" />
                {undoText}
              </div>
            ),
            onClick: onUndo,
          }
        : undefined,
      cancel: {
        label: <X className="h-3 w-3" />,
        onClick: onClose,
      },
    })
  },

  info: ({
    message,
    onClose,
    onUndo,
    undoText = 'Action',
    duration = 6000,
  }: ToastWithActionsOptions) => {
    return toast.info(message, {
      duration,
      action: onUndo
        ? {
            label: (
              <div className="flex items-center gap-2">
                <span>{undoText}</span>
              </div>
            ),
            onClick: onUndo,
          }
        : undefined,
      cancel: {
        label: <X className="h-3 w-3" />,
        onClick: onClose,
      },
    })
  },

  warning: ({
    message,
    onClose,
    onUndo,
    undoText = 'Action',
    duration = 7000,
  }: ToastWithActionsOptions) => {
    return toast.warning(message, {
      duration,
      action: onUndo
        ? {
            label: (
              <div className="flex items-center gap-2">
                <span>{undoText}</span>
              </div>
            ),
            onClick: onUndo,
          }
        : undefined,
      cancel: {
        label: <X className="h-3 w-3" />,
        onClick: onClose,
      },
    })
  },
}

/**
 * Simple toast with just close button
 */
export const toastWithClose = {
  success: (message: string, onClose?: () => void) => {
    return toast.success(message, {
      duration: 6000,
      cancel: {
        label: <X className="h-3 w-3" />,
        onClick: onClose,
      },
    })
  },

  error: (message: string, onClose?: () => void) => {
    return toast.error(message, {
      duration: 8000,
      cancel: {
        label: <X className="h-3 w-3" />,
        onClick: onClose,
      },
    })
  },

  info: (message: string, onClose?: () => void) => {
    return toast.info(message, {
      duration: 6000,
      cancel: {
        label: <X className="h-3 w-3" />,
        onClick: onClose,
      },
    })
  },

  warning: (message: string, onClose?: () => void) => {
    return toast.warning(message, {
      duration: 7000,
      cancel: {
        label: <X className="h-3 w-3" />,
        onClick: onClose,
      },
    })
  },
}

/**
 * Toast for file operations with undo functionality
 */
export const fileOperationToast = {
  success: (operationType: string, count: number, onUndo?: () => void) => {
    const message = `Successfully ${operationType} ${count} item${count > 1 ? 's' : ''}`
    return toastWithActions.success({
      message,
      onUndo,
      undoText: 'Undo',
    })
  },

  error: (operationType: string, count: number, onRetry?: () => void) => {
    const message = `Failed to ${operationType} ${count} item${count > 1 ? 's' : ''}`
    return toastWithActions.error({
      message,
      onUndo: onRetry,
      undoText: 'Retry',
    })
  },
}
