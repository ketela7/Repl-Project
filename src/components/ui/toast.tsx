/**
 * Enhanced toast notification utilities for better user feedback
 */
import { toast } from 'sonner'
import React from 'react'
import { CheckCircle, XCircle, AlertTriangle, Info, Copy, Download, Trash2, FolderPlus, Share2, Upload } from 'lucide-react'

export interface ToastAction {
  label: string
  onClick: () => void
}

export interface ToastOptions {
  description?: string
  action?: ToastAction
  duration?: number
}

/**
 * Success notifications with appropriate icons
 */
export const successToast = {
  // File operations
  copied: (count?: number) =>
    toast.success(count && count > 1 ? `${count} items copied to clipboard` : 'Copied to clipboard', {
      icon: React.createElement(Copy, { className: 'h-4 w-4' }),
      duration: 2000,
    }),

  downloaded: (fileName?: string) =>
    toast.success(fileName ? `Downloaded: ${fileName}` : 'Download started', {
      icon: React.createElement(Download, { className: 'h-4 w-4' }),
      duration: 3000,
    }),

  uploaded: (count: number = 1) =>
    toast.success(count > 1 ? `${count} files uploaded successfully` : 'File uploaded successfully', {
      icon: React.createElement(Upload, { className: 'h-4 w-4' }),
      duration: 3000,
    }),

  deleted: (count: number = 1) =>
    toast.success(count > 1 ? `${count} items moved to trash` : 'Item moved to trash', {
      icon: React.createElement(Trash2, { className: 'h-4 w-4' }),
      duration: 3000,
    }),

  folderCreated: (name: string) =>
    toast.success(`Folder "${name}" created`, {
      icon: React.createElement(FolderPlus, { className: 'h-4 w-4' }),
      duration: 3000,
    }),

  shared: (count: number = 1) =>
    toast.success(count > 1 ? `${count} items shared successfully` : 'Item shared successfully', {
      icon: React.createElement(Share2, { className: 'h-4 w-4' }),
      duration: 3000,
    }),

  // Bulk operations
  bulkOperation: (operation: string, successCount: number, totalCount: number) =>
    toast.success(`${operation} completed: ${successCount}/${totalCount} items processed`, {
      icon: React.createElement(CheckCircle, { className: 'h-4 w-4' }),
      duration: 4000,
    }),

  // Authentication
  signedIn: () =>
    toast.success('Successfully signed in', {
      icon: React.createElement(CheckCircle, { className: 'h-4 w-4' }),
      duration: 2000,
    }),

  signedOut: () =>
    toast.success('Successfully signed out', {
      icon: React.createElement(CheckCircle, { className: 'h-4 w-4' }),
      duration: 2000,
    }),

  // Generic success
  generic: (message: string, options?: ToastOptions) =>
    toast.success(message, {
      icon: React.createElement(CheckCircle, { className: 'h-4 w-4' }),
      description: options?.description,
      action: options?.action,
      duration: options?.duration || 3000,
    }),
}

/**
 * Error notifications
 */
export const errorToast = {
  // File operations
  uploadFailed: (fileName?: string) =>
    toast.error(fileName ? `Failed to upload: ${fileName}` : 'Upload failed', {
      icon: React.createElement(XCircle, { className: 'h-4 w-4' }),
      duration: 5000,
    }),

  downloadFailed: (fileName?: string) =>
    toast.error(fileName ? `Failed to download: ${fileName}` : 'Download failed', {
      icon: React.createElement(XCircle, { className: 'h-4 w-4' }),
      duration: 5000,
    }),

  deleteFailed: (count: number = 1) =>
    toast.error(count > 1 ? `Failed to delete ${count} items` : 'Failed to delete item', {
      icon: React.createElement(XCircle, { className: 'h-4 w-4' }),
      duration: 5000,
    }),

  // Authentication & permissions
  authRequired: () =>
    toast.error('Authentication required', {
      icon: React.createElement(XCircle, { className: 'h-4 w-4' }),
      description: 'Please sign in to continue',
      duration: 4000,
    }),

  permissionDenied: () =>
    toast.error('Permission denied', {
      icon: React.createElement(XCircle, { className: 'h-4 w-4' }),
      description: "You don't have permission to perform this action",
      duration: 4000,
    }),

  driveAccessDenied: () =>
    toast.error('Google Drive access required', {
      icon: React.createElement(XCircle, { className: 'h-4 w-4' }),
      description: 'Please grant Drive permissions to continue',
      duration: 5000,
    }),

  // Network & API
  networkError: () =>
    toast.error('Network error', {
      icon: React.createElement(XCircle, { className: 'h-4 w-4' }),
      description: 'Please check your connection and try again',
      duration: 5000,
    }),

  apiError: (message?: string) =>
    toast.error('Operation failed', {
      icon: React.createElement(XCircle, { className: 'h-4 w-4' }),
      description: message || 'An unexpected error occurred',
      duration: 5000,
    }),

  // Generic error
  generic: (message: string, options?: ToastOptions) =>
    toast.error(message, {
      icon: React.createElement(XCircle, { className: 'h-4 w-4' }),
      description: options?.description,
      action: options?.action,
      duration: options?.duration || 5000,
    }),
}

/**
 * Warning notifications
 */
export const warningToast = {
  // File operations
  partialSuccess: (successCount: number, totalCount: number, operation: string) =>
    toast.warning(`${operation} partially completed`, {
      icon: React.createElement(AlertTriangle, { className: 'h-4 w-4' }),
      description: `${successCount} of ${totalCount} items processed`,
      duration: 4000,
    }),

  largeFileWarning: (fileName: string) =>
    toast.warning('Large file detected', {
      icon: React.createElement(AlertTriangle, { className: 'h-4 w-4' }),
      description: `${fileName} may take longer to process`,
      duration: 4000,
    }),

  quotaWarning: () =>
    toast.warning('Storage quota running low', {
      icon: React.createElement(AlertTriangle, { className: 'h-4 w-4' }),
      description: 'Consider cleaning up old files',
      duration: 5000,
    }),

  // Generic warning
  generic: (message: string, options?: ToastOptions) =>
    toast.warning(message, {
      icon: React.createElement(AlertTriangle, { className: 'h-4 w-4' }),
      description: options?.description,
      action: options?.action,
      duration: options?.duration || 4000,
    }),
}

/**
 * Info notifications
 */
export const infoToast = {
  // File operations
  processing: (operation: string, count?: number) =>
    toast.info(count && count > 1 ? `Processing ${count} items...` : `${operation} in progress...`, {
      icon: React.createElement(Info, { className: 'h-4 w-4' }),
      duration: 2000,
    }),

  syncStarted: () =>
    toast.info('Syncing with Google Drive...', {
      icon: React.createElement(Info, { className: 'h-4 w-4' }),
      duration: 2000,
    }),

  offlineMode: () =>
    toast.info("You're currently offline", {
      icon: React.createElement(Info, { className: 'h-4 w-4' }),
      description: 'Some features may be limited',
      duration: 4000,
    }),

  // Generic info
  generic: (message: string, options?: ToastOptions) =>
    toast.info(message, {
      icon: React.createElement(Info, { className: 'h-4 w-4' }),
      description: options?.description,
      action: options?.action,
      duration: options?.duration || 3000,
    }),
}

/**
 * Loading toast for long operations
 */
export const loadingToast = {
  start: (message: string, id?: string) =>
    toast.loading(message, {
      id: id || 'loading',
      duration: Infinity,
    }),

  update: (message: string, id: string = 'loading') =>
    toast.loading(message, {
      id,
      duration: Infinity,
    }),

  success: (message: string, id: string = 'loading') =>
    toast.success(message, {
      id,
      icon: React.createElement(CheckCircle, { className: 'h-4 w-4' }),
      duration: 3000,
    }),

  error: (message: string, id: string = 'loading') =>
    toast.error(message, {
      id,
      icon: React.createElement(XCircle, { className: 'h-4 w-4' }),
      duration: 5000,
    }),

  dismiss: (id: string = 'loading') => toast.dismiss(id),
}

/**
 * Utility functions for common toast patterns
 */
export const toastUtils = {
  success: successToast,
  error: errorToast,
  loading: loadingToast,
  info: infoToast,

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
    const loadingId = 'download'
    loadingToast.start(`Downloading${fileName ? ` ${fileName}` : ''}...`, loadingId)

    try {
      await downloadFn()
      loadingToast.success(`Download completed${fileName ? `: ${fileName}` : ''}`, loadingId)
    } catch (error) {
      loadingToast.error(`Download failed${fileName ? `: ${fileName}` : ''}`, loadingId)
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
    const loadingId = 'operation'
    loadingToast.start(`Starting ${operation}...`, loadingId)

    try {
      const result = await operationFn()

      if (result.success === result.total) {
        loadingToast.success(`${operation} completed successfully (${result.success}/${result.total})`, loadingId)
      } else if (result.success > 0) {
        toast.warning(`${operation} partially completed`, {
          id: loadingId,
          icon: React.createElement(AlertTriangle, { className: 'h-4 w-4' }),
          description: `${result.success} of ${result.total} items processed`,
          duration: 4000,
        })
      } else {
        loadingToast.error(`${operation} failed`, loadingId)
      }

      return result
    } catch (error) {
      loadingToast.error(`${operation} failed`, loadingId)
      throw error
    }
  },
}