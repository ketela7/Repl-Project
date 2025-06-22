"use client";

import React from 'react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Info, 
  Copy, 
  Download, 
  Upload,
  Share2,
  Trash2,
  FolderPlus,
  Loader2 
} from 'lucide-react';

interface EnhancedToastProps {
  type: 'success' | 'error' | 'warning' | 'info' | 'loading';
  title: string;
  description?: string;
  icon?: React.ReactNode;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Enhanced toast component with consistent styling and better mobile support
 */
export function showEnhancedToast({
  type,
  title,
  description,
  icon,
  duration,
  action
}: EnhancedToastProps) {
  const getIcon = () => {
    if (icon) return icon;
    
    switch (type) {
      case 'success':
        return React.createElement(CheckCircle, { className: "h-4 w-4 text-green-600" });
      case 'error':
        return React.createElement(XCircle, { className: "h-4 w-4 text-red-600" });
      case 'warning':
        return React.createElement(AlertTriangle, { className: "h-4 w-4 text-yellow-600" });
      case 'info':
        return React.createElement(Info, { className: "h-4 w-4 text-blue-600" });
      case 'loading':
        return React.createElement(Loader2, { className: "h-4 w-4 animate-spin text-gray-600" });
      default:
        return React.createElement(Info, { className: "h-4 w-4" });
    }
  };

  const getDuration = () => {
    if (duration !== undefined) return duration;
    if (type === 'loading') return Infinity;
    if (type === 'error') return 5000;
    return 3000;
  };

  const toastOptions = {
    icon: getIcon(),
    description,
    duration: getDuration(),
    action: action ? {
      label: action.label,
      onClick: action.onClick,
    } : undefined,
    className: cn(
      "group toast",
      "border-0 shadow-lg",
      "bg-white dark:bg-gray-900",
      "text-gray-900 dark:text-gray-100",
      type === 'success' && "border-l-4 border-l-green-500",
      type === 'error' && "border-l-4 border-l-red-500",
      type === 'warning' && "border-l-4 border-l-yellow-500",
      type === 'info' && "border-l-4 border-l-blue-500",
      type === 'loading' && "border-l-4 border-l-gray-400"
    ),
  };

  switch (type) {
    case 'success':
      return toast.success(title, toastOptions);
    case 'error':
      return toast.error(title, toastOptions);
    case 'warning':
      return toast.warning(title, toastOptions);
    case 'info':
      return toast.info(title, toastOptions);
    case 'loading':
      return toast.loading(title, toastOptions);
    default:
      return toast(title, toastOptions);
  }
}

/**
 * Quick toast utilities for common operations
 */
export const quickToast = {
  /**
   * Show clipboard copy notification like in the screenshot
   */
  copied: (text?: string) => {
    showEnhancedToast({
      type: 'success',
      title: 'Copied to clipboard',
      description: text ? `${text}` : undefined,
      icon: React.createElement(Copy, { className: "h-4 w-4 text-green-600" }),
      duration: 2000,
    });
  },

  /**
   * Show download started notification
   */
  downloadStarted: (fileName?: string) => {
    showEnhancedToast({
      type: 'info',
      title: 'Download started',
      description: fileName ? `Downloading ${fileName}` : undefined,
      icon: React.createElement(Download, { className: "h-4 w-4 text-blue-600" }),
      duration: 2000,
    });
  },

  /**
   * Show upload success notification
   */
  uploadSuccess: (fileName?: string) => {
    showEnhancedToast({
      type: 'success',
      title: 'Upload completed',
      description: fileName ? `${fileName} uploaded successfully` : undefined,
      icon: React.createElement(Upload, { className: "h-4 w-4 text-green-600" }),
      duration: 3000,
    });
  },

  /**
   * Show share success notification
   */
  shareSuccess: (fileName?: string) => {
    showEnhancedToast({
      type: 'success',
      title: 'Share link copied',
      description: fileName ? `${fileName} link copied to clipboard` : undefined,
      icon: React.createElement(Share2, { className: "h-4 w-4 text-green-600" }),
      duration: 3000,
    });
  },

  /**
   * Show delete success notification
   */
  deleteSuccess: (count: number = 1) => {
    showEnhancedToast({
      type: 'success',
      title: count > 1 ? `${count} items moved to trash` : 'Item moved to trash',
      icon: React.createElement(Trash2, { className: "h-4 w-4 text-green-600" }),
      duration: 3000,
    });
  },

  /**
   * Show folder created notification
   */
  folderCreated: (folderName: string) => {
    showEnhancedToast({
      type: 'success',
      title: 'Folder created',
      description: `"${folderName}" created successfully`,
      icon: React.createElement(FolderPlus, { className: "h-4 w-4 text-green-600" }),
      duration: 3000,
    });
  },

  /**
   * Show error notification
   */
  error: (title: string, description?: string) => {
    showEnhancedToast({
      type: 'error',
      title,
      description,
      duration: 5000,
    });
  },

  /**
   * Show loading notification that can be updated
   */
  loading: (title: string, id?: string) => {
    return toast.loading(title, {
      id: id || 'loading',
      icon: React.createElement(Loader2, { className: "h-4 w-4 animate-spin" }),
      duration: Infinity,
    });
  },

  /**
   * Update loading toast with success
   */
  updateSuccess: (title: string, id: string = 'loading') => {
    toast.success(title, {
      id,
      icon: React.createElement(CheckCircle, { className: "h-4 w-4 text-green-600" }),
      duration: 3000,
    });
  },

  /**
   * Update loading toast with error
   */
  updateError: (title: string, id: string = 'loading') => {
    toast.error(title, {
      id,
      icon: React.createElement(XCircle, { className: "h-4 w-4 text-red-600" }),
      duration: 5000,
    });
  },
};

/**
 * Preset notifications for common file operations
 */
export const fileOperationToasts = {
  copy: {
    start: (fileName: string) => quickToast.loading(`Copying "${fileName}"...`, 'copy-operation'),
    success: (fileName: string) => quickToast.updateSuccess(`"${fileName}" copied successfully`, 'copy-operation'),
    error: (fileName: string) => quickToast.updateError(`Failed to copy "${fileName}"`, 'copy-operation'),
  },
  
  move: {
    start: (fileName: string) => quickToast.loading(`Moving "${fileName}"...`, 'move-operation'),
    success: (fileName: string) => quickToast.updateSuccess(`"${fileName}" moved successfully`, 'move-operation'),
    error: (fileName: string) => quickToast.updateError(`Failed to move "${fileName}"`, 'move-operation'),
  },
  
  rename: {
    start: (fileName: string) => quickToast.loading(`Renaming "${fileName}"...`, 'rename-operation'),
    success: (oldName: string, newName: string) => quickToast.updateSuccess(`Renamed to "${newName}"`, 'rename-operation'),
    error: (fileName: string) => quickToast.updateError(`Failed to rename "${fileName}"`, 'rename-operation'),
  },
  
  delete: {
    start: (count: number) => quickToast.loading(
      count > 1 ? `Deleting ${count} items...` : 'Deleting item...', 
      'delete-operation'
    ),
    success: (count: number) => quickToast.updateSuccess(
      count > 1 ? `${count} items moved to trash` : 'Item moved to trash', 
      'delete-operation'
    ),
    error: (count: number) => quickToast.updateError(
      count > 1 ? `Failed to delete ${count} items` : 'Failed to delete item', 
      'delete-operation'
    ),
  },
  
  upload: {
    start: (fileName: string) => quickToast.loading(`Uploading "${fileName}"...`, 'upload-operation'),
    success: (fileName: string) => quickToast.updateSuccess(`"${fileName}" uploaded successfully`, 'upload-operation'),
    error: (fileName: string) => quickToast.updateError(`Failed to upload "${fileName}"`, 'upload-operation'),
  },
  
  share: {
    start: (fileName: string) => quickToast.loading(`Sharing "${fileName}"...`, 'share-operation'),
    success: (fileName: string) => quickToast.updateSuccess(`"${fileName}" shared successfully`, 'share-operation'),
    error: (fileName: string) => quickToast.updateError(`Failed to share "${fileName}"`, 'share-operation'),
  },
};