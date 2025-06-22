/**
 * Consolidated toast notification system
 * Combines functionality from both toast files with optimized API
 */
import { toast } from "sonner";
import React from "react";
import { CheckCircle, XCircle, AlertTriangle, Info, Copy, Download, Trash2, FolderPlus, Share2, Upload, Loader2 } from "lucide-react";

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastOptions {
  description?: string;
  action?: ToastAction;
  duration?: number;
  icon?: React.ReactNode;
}

/**
 * Core toast utilities with consistent API
 */
export const Toast = {
  // Basic notifications
  success: (message: string, options?: ToastOptions) =>
    toast.success(message, {
      icon: React.createElement(CheckCircle, { className: "h-4 w-4" }),
      description: options?.description,
      action: options?.action,
      duration: options?.duration || 3000,
    }),

  error: (message: string, options?: ToastOptions) =>
    toast.error(message, {
      icon: React.createElement(XCircle, { className: "h-4 w-4" }),
      description: options?.description,
      action: options?.action,
      duration: options?.duration || 5000,
    }),

  warning: (message: string, options?: ToastOptions) =>
    toast.warning(message, {
      icon: React.createElement(AlertTriangle, { className: "h-4 w-4" }),
      description: options?.description,
      action: options?.action,
      duration: options?.duration || 4000,
    }),

  info: (message: string, options?: ToastOptions) =>
    toast.info(message, {
      icon: React.createElement(Info, { className: "h-4 w-4" }),
      description: options?.description,
      action: options?.action,
      duration: options?.duration || 3000,
    }),

  // Loading operations
  loading: (message: string, id?: string) =>
    toast.loading(message, {
      id: id || "loading",
      duration: Infinity,
      icon: React.createElement(Loader2, { className: "h-4 w-4 animate-spin" }),
    }),

  // Update loading toast
  updateSuccess: (message: string, id: string = "loading") =>
    toast.success(message, {
      id,
      icon: React.createElement(CheckCircle, { className: "h-4 w-4" }),
      duration: 3000,
    }),

  updateError: (message: string, id: string = "loading") =>
    toast.error(message, {
      id,
      icon: React.createElement(XCircle, { className: "h-4 w-4" }),
      duration: 5000,
    }),

  dismiss: (id?: string) => toast.dismiss(id),
};

/**
 * File operation specific toasts
 */
export const FileToast = {
  copied: (count?: number) =>
    Toast.success(
      count && count > 1 ? `${count} items copied` : "Copied to clipboard",
      { icon: React.createElement(Copy, { className: "h-4 w-4" }), duration: 2000 }
    ),

  uploaded: (fileName?: string) =>
    Toast.success(
      fileName ? `"${fileName}" uploaded` : "Upload completed",
      { icon: React.createElement(Upload, { className: "h-4 w-4" }) }
    ),

  downloaded: (fileName?: string) =>
    Toast.success(
      fileName ? `"${fileName}" downloaded` : "Download completed",
      { icon: React.createElement(Download, { className: "h-4 w-4" }) }
    ),

  deleted: (count: number = 1) =>
    Toast.success(
      count > 1 ? `${count} items moved to trash` : "Item moved to trash",
      { icon: React.createElement(Trash2, { className: "h-4 w-4" }) }
    ),

  shared: (fileName?: string) =>
    Toast.success(
      fileName ? `"${fileName}" shared` : "Shared successfully",
      { icon: React.createElement(Share2, { className: "h-4 w-4" }) }
    ),

  folderCreated: (name: string) =>
    Toast.success(`Folder "${name}" created`, {
      icon: React.createElement(FolderPlus, { className: "h-4 w-4" })
    }),
};

/**
 * Operation workflow toasts with loading states
 */
export const OperationToast = {
  async execute<T>(
    operation: string,
    operationFn: () => Promise<T>,
    fileName?: string
  ): Promise<T> {
    const loadingId = `operation-${Date.now()}`;
    const message = fileName ? `${operation} "${fileName}"...` : `${operation}...`;
    
    Toast.loading(message, loadingId);
    
    try {
      const result = await operationFn();
      Toast.updateSuccess(
        fileName ? `"${fileName}" ${operation.toLowerCase()}d` : `${operation} completed`,
        loadingId
      );
      return result;
    } catch (error) {
      Toast.updateError(
        fileName ? `Failed to ${operation.toLowerCase()} "${fileName}"` : `${operation} failed`,
        loadingId
      );
      throw error;
    }
  },

  bulk: async (
    operation: string,
    total: number,
    operationFn: () => Promise<{ success: number; failed: number }>
  ) => {
    const loadingId = "bulk-operation";
    Toast.loading(`${operation} ${total} items...`, loadingId);
    
    try {
      const result = await operationFn();
      
      if (result.failed === 0) {
        Toast.updateSuccess(`${operation} completed (${result.success}/${total})`, loadingId);
      } else if (result.success > 0) {
        Toast.warning(`${operation} partially completed`, {
          description: `${result.success} of ${total} items processed`,
          duration: 4000,
        });
        Toast.dismiss(loadingId);
      } else {
        Toast.updateError(`${operation} failed`, loadingId);
      }
      
      return result;
    } catch (error) {
      Toast.updateError(`${operation} failed`, loadingId);
      throw error;
    }
  },
};

/**
 * Quick access utilities
 */
export const QuickToast = {
  authRequired: () => Toast.error("Authentication required", {
    description: "Please sign in to continue"
  }),

  permissionDenied: () => Toast.error("Permission denied", {
    description: "You don't have permission for this action"
  }),

  networkError: () => Toast.error("Network error", {
    description: "Please check your connection and try again"
  }),

  quotaExceeded: () => Toast.warning("Storage quota exceeded", {
    description: "Please free up space or upgrade your plan"
  }),

  offline: () => Toast.info("You're offline", {
    description: "Some features may be limited"
  }),
};

// Export consolidated API
export { toast };
export default Toast;