/**
 * Enhanced toast notification utilities using shadcn toast system
 * Migration from Sonner to Radix UI based toasts
 */
import React from 'react'
import { CheckCircle, XCircle, AlertTriangle, Info, Copy, Download, Trash2, FolderPlus, Share2, Upload } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { ToastAction } from '@/components/ui/toast-new'

export interface ToastOptions {
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  duration?: number
}

/**
 * Success notifications with appropriate icons
 */
export const successToast = {
  // File operations
  copied: (count?: number) =>
    toast({
      variant: 'success',
      title: (
        <div className="flex items-center gap-2">
          <Copy className="h-4 w-4" />
          {count && count > 1 ? `${count} items copied to clipboard` : 'Copied to clipboard'}
        </div>
      ),
      duration: 2000,
    }),

  downloaded: (fileName?: string) =>
    toast({
      variant: 'success',
      title: (
        <div className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          {fileName ? `Downloaded: ${fileName}` : 'Download started'}
        </div>
      ),
      duration: 3000,
    }),

  uploaded: (count: number = 1) =>
    toast({
      variant: 'success',
      title: (
        <div className="flex items-center gap-2">
          <Upload className="h-4 w-4" />
          {count > 1 ? `${count} files uploaded successfully` : 'File uploaded successfully'}
        </div>
      ),
      duration: 3000,
    }),

  deleted: (count: number = 1) =>
    toast({
      variant: 'success',
      title: (
        <div className="flex items-center gap-2">
          <Trash2 className="h-4 w-4" />
          {count > 1 ? `${count} items moved to trash` : 'Item moved to trash'}
        </div>
      ),
      duration: 3000,
    }),

  folderCreated: (name: string) =>
    toast({
      variant: 'success',
      title: (
        <div className="flex items-center gap-2">
          <FolderPlus className="h-4 w-4" />
          Folder created
        </div>
      ),
      description: `"${name}" has been created successfully`,
      duration: 3000,
    }),

  shared: (count: number = 1) =>
    toast({
      variant: 'success',
      title: (
        <div className="flex items-center gap-2">
          <Share2 className="h-4 w-4" />
          {count > 1 ? `${count} items shared successfully` : 'Item shared successfully'}
        </div>
      ),
      duration: 3000,
    }),

  // Bulk operations
  bulkOperation: (operation: string, successCount: number, totalCount: number) =>
    toast({
      variant: 'success',
      title: (
        <div className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4" />
          {operation} completed
        </div>
      ),
      description: `${successCount}/${totalCount} items processed successfully`,
      duration: 4000,
    }),

  // Authentication
  signedIn: () =>
    toast({
      variant: 'success',
      title: (
        <div className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4" />
          Successfully signed in
        </div>
      ),
      duration: 2000,
    }),

  signedOut: () =>
    toast({
      variant: 'success',
      title: (
        <div className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4" />
          Successfully signed out
        </div>
      ),
      duration: 2000,
    }),

  // Generic success
  generic: (message: string, options?: ToastOptions) =>
    toast({
      variant: 'success',
      title: (
        <div className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4" />
          {message}
        </div>
      ),
      description: options?.description,
      action: options?.action ? (
        <ToastAction
          altText={options.action.label}
          onClick={options.action.onClick}
        >
          {options.action.label}
        </ToastAction>
      ) : undefined,
      duration: options?.duration || 3000,
    }),
}

/**
 * Error notifications
 */
export const errorToast = {
  // File operations
  uploadFailed: (fileName?: string) =>
    toast({
      variant: 'destructive',
      title: (
        <div className="flex items-center gap-2">
          <XCircle className="h-4 w-4" />
          Upload failed
        </div>
      ),
      description: fileName ? `Failed to upload: ${fileName}` : 'Upload operation failed',
      duration: 5000,
    }),

  downloadFailed: (fileName?: string) =>
    toast({
      variant: 'destructive',
      title: (
        <div className="flex items-center gap-2">
          <XCircle className="h-4 w-4" />
          Download failed
        </div>
      ),
      description: fileName ? `Failed to download: ${fileName}` : 'Download operation failed',
      duration: 5000,
    }),

  deleteFailed: (count: number = 1) =>
    toast({
      variant: 'destructive',
      title: (
        <div className="flex items-center gap-2">
          <XCircle className="h-4 w-4" />
          Delete failed
        </div>
      ),
      description: count > 1 ? `Failed to delete ${count} items` : 'Failed to delete item',
      duration: 5000,
    }),

  // Authentication & permissions
  authRequired: () =>
    toast({
      variant: 'destructive',
      title: (
        <div className="flex items-center gap-2">
          <XCircle className="h-4 w-4" />
          Authentication required
        </div>
      ),
      description: 'Please sign in to continue',
      duration: 4000,
    }),

  permissionDenied: () =>
    toast({
      variant: 'destructive',
      title: (
        <div className="flex items-center gap-2">
          <XCircle className="h-4 w-4" />
          Permission denied
        </div>
      ),
      description: "You don't have permission to perform this action",
      duration: 4000,
    }),

  driveAccessDenied: () =>
    toast({
      variant: 'destructive',
      title: (
        <div className="flex items-center gap-2">
          <XCircle className="h-4 w-4" />
          Google Drive access required
        </div>
      ),
      description: 'Please grant Drive permissions to continue',
      duration: 5000,
    }),

  // Network & API
  networkError: () =>
    toast({
      variant: 'destructive',
      title: (
        <div className="flex items-center gap-2">
          <XCircle className="h-4 w-4" />
          Network error
        </div>
      ),
      description: 'Please check your connection and try again',
      duration: 5000,
    }),

  apiError: (message?: string) =>
    toast({
      variant: 'destructive',
      title: (
        <div className="flex items-center gap-2">
          <XCircle className="h-4 w-4" />
          Operation failed
        </div>
      ),
      description: message || 'An unexpected error occurred',
      duration: 5000,
    }),

  // Generic error
  generic: (message: string, options?: ToastOptions) =>
    toast({
      variant: 'destructive',
      title: (
        <div className="flex items-center gap-2">
          <XCircle className="h-4 w-4" />
          {message}
        </div>
      ),
      description: options?.description,
      action: options?.action ? (
        <ToastAction
          altText={options.action.label}
          onClick={options.action.onClick}
        >
          {options.action.label}
        </ToastAction>
      ) : undefined,
      duration: options?.duration || 5000,
    }),
}

/**
 * Warning notifications
 */
export const warningToast = {
  // File operations
  partialSuccess: (successCount: number, totalCount: number, operation: string) =>
    toast({
      variant: 'warning',
      title: (
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          {operation} partially completed
        </div>
      ),
      description: `${successCount} of ${totalCount} items processed`,
      duration: 4000,
    }),

  largeFileWarning: (fileName: string) =>
    toast({
      variant: 'warning',
      title: (
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          Large file detected
        </div>
      ),
      description: `${fileName} may take longer to process`,
      duration: 4000,
    }),

  quotaWarning: () =>
    toast({
      variant: 'warning',
      title: (
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          Storage quota running low
        </div>
      ),
      description: 'Consider cleaning up old files',
      duration: 5000,
    }),

  // Generic warning
  generic: (message: string, options?: ToastOptions) =>
    toast({
      variant: 'warning',
      title: (
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          {message}
        </div>
      ),
      description: options?.description,
      action: options?.action ? (
        <ToastAction
          altText={options.action.label}
          onClick={options.action.onClick}
        >
          {options.action.label}
        </ToastAction>
      ) : undefined,
      duration: options?.duration || 4000,
    }),
}

/**
 * Info notifications
 */
export const infoToast = {
  // File operations
  processing: (operation: string, count?: number) =>
    toast({
      variant: 'info',
      title: (
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4" />
          Processing
        </div>
      ),
      description: count && count > 1 ? `Processing ${count} items...` : `${operation} in progress...`,
      duration: 2000,
    }),

  syncStarted: () =>
    toast({
      variant: 'info',
      title: (
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4" />
          Syncing with Google Drive
        </div>
      ),
      duration: 2000,
    }),

  offlineMode: () =>
    toast({
      variant: 'info',
      title: (
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4" />
          You're currently offline
        </div>
      ),
      description: 'Some features may be limited',
      duration: 4000,
    }),

  // Generic info
  generic: (message: string, options?: ToastOptions) =>
    toast({
      variant: 'info',
      title: (
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4" />
          {message}
        </div>
      ),
      description: options?.description,
      action: options?.action ? (
        <ToastAction
          altText={options.action.label}
          onClick={options.action.onClick}
        >
          {options.action.label}
        </ToastAction>
      ) : undefined,
      duration: options?.duration || 3000,
    }),
}

/**
 * Loading toast for long operations
 */
export const loadingToast = {
  start: (message: string, id?: string) => {
    const toastRef = toast({
      variant: 'default',
      title: (
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
          {message}
        </div>
      ),
      duration: Infinity,
    })
    return toastRef
  },

  update: (message: string, toastRef: any) => {
    if (toastRef && toastRef.update) {
      toastRef.update({
        title: (
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
            {message}
          </div>
        ),
      })
    }
  },

  success: (message: string, toastRef: any) => {
    if (toastRef && toastRef.update) {
      toastRef.update({
        variant: 'success',
        title: (
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            {message}
          </div>
        ),
        duration: 3000,
      })
    }
  },

  error: (message: string, toastRef: any) => {
    if (toastRef && toastRef.update) {
      toastRef.update({
        variant: 'destructive',
        title: (
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4" />
            {message}
          </div>
        ),
        duration: 5000,
      })
    }
  },

  dismiss: (toastRef: any) => {
    if (toastRef && toastRef.dismiss) {
      toastRef.dismiss()
    }
  },
}

/**
 * Utility functions for common toast patterns
 */
export const toastUtils = {
  success: successToast,
  error: errorToast,
  warning: warningToast,
  info: infoToast,
  loading: loadingToast,

  /**
   * Show clipboard copy feedback
   */
  clipboard: (text: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        successToast.copied()
      })
      .catch(() => {
        errorToast.generic('Failed to copy to clipboard')
      })
  },

  /**
   * Download utility with progress feedback
   */
  download: async (downloadFn: () => Promise<void>, fileName?: string) => {
    const toastRef = loadingToast.start(`Downloading${fileName ? ` ${fileName}` : ''}...`)

    try {
      await downloadFn()
      loadingToast.success(`Download completed${fileName ? `: ${fileName}` : ''}`, toastRef)
    } catch (error) {
      loadingToast.error(`Download failed${fileName ? `: ${fileName}` : ''}`, toastRef)
      throw error
    }
  },

  /**
   * Show operation progress
   */
  operation: async (
    operation: string,
    operationFn: () => Promise<{
      success: number
      total: number
      failed?: string[]
    }>
  ) => {
    const toastRef = loadingToast.start(`Starting ${operation}...`)

    try {
      const result = await operationFn()

      if (result.success === result.total) {
        loadingToast.success(`${operation} completed successfully (${result.success}/${result.total})`, toastRef)
      } else if (result.success > 0) {
        warningToast.partialSuccess(result.success, result.total, operation)
        loadingToast.dismiss(toastRef)
      } else {
        loadingToast.error(`${operation} failed`, toastRef)
      }

      return result
    } catch (error) {
      loadingToast.error(`${operation} failed`, toastRef)
      throw error
    }
  },
}