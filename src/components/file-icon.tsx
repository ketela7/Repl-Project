"use client";

import React from 'react';
import { 
  FileText, 
  Folder, 
  BarChart3, 
  TrendingUp, 
  FileCheck, 
  Palette, 
  BookOpen, 
  Image, 
  Video, 
  Music, 
  Archive,
  File,
  FileSpreadsheet,
  Presentation,
  FileImage,
  FileVideo,
  FileAudio,
  Code,
  FileCode,
  Database
} from 'lucide-react';
import { getFileIconName, getFileIconColor } from '@/lib/google-drive/utils';

interface FileIconProps {
  mimeType: string;
  className?: string;
  strokeWidth?: number;
  style?: 'lucide' | 'filled' | 'outlined';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showBackground?: boolean;
  animated?: boolean;
}

export function FileIcon({ 
  mimeType, 
  className = "h-4 w-4", 
  strokeWidth = 2,
  style = 'lucide',
  size = 'md',
  showBackground = false,
  animated = false
}: FileIconProps) {
  const iconName = getFileIconName(mimeType);
  const colorClass = getFileIconColor(mimeType);
  
  // Enhanced size mapping for cross-platform compatibility
  const sizeClasses = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
    xl: 'h-8 w-8'
  };
  
  const finalClassName = className === "h-4 w-4" ? sizeClasses[size] : className;
  
  const iconProps = {
    className: `${finalClassName} ${colorClass} ${animated ? 'transition-all duration-200 hover:scale-110' : ''} ${showBackground ? 'p-1 rounded bg-muted/50' : ''} drop-shadow-sm`,
    strokeWidth: style === 'filled' ? 0 : strokeWidth,
    fill: style === 'filled' ? 'currentColor' : 'none'
  };

  const iconComponents: Record<string, React.ComponentType<any>> = {
    Folder,
    FileText,
    FileSpreadsheet,
    Presentation,
    FileCheck,
    Palette,
    BookOpen,
    FileImage,
    FileVideo,
    FileAudio,
    Archive,
    FileCode,
    Database,
    File
  };

  const IconComponent = iconComponents[iconName] || File;
  
  return <IconComponent {...iconProps} />;
}

// Enhanced helper function following optimization guidelines
export function getFileIcon(mimeType: string, options: {
  className?: string;
  style?: 'lucide' | 'filled' | 'outlined';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showBackground?: boolean;
  animated?: boolean;
} = {}) {
  const { className, ...iconOptions } = options;
  return <FileIcon mimeType={mimeType} className={className} {...iconOptions} />;
}

// Utility functions for file type categorization (extending existing pattern)
export const fileTypeUtils = {
  isPreviewable: (mimeType: string): boolean => {
    return mimeType.startsWith('image/') || 
           mimeType.startsWith('video/') || 
           mimeType.includes('pdf') ||
           mimeType.includes('text/');
  },

  isEditable: (mimeType: string): boolean => {
    return mimeType.includes('document') ||
           mimeType.includes('spreadsheet') ||
           mimeType.includes('presentation') ||
           mimeType.startsWith('text/');
  },

  getCategory: (mimeType: string): 'document' | 'image' | 'video' | 'audio' | 'archive' | 'code' | 'other' => {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.includes('zip') || mimeType.includes('archive')) return 'archive';
    if (mimeType.includes('code') || mimeType.includes('javascript') || mimeType.includes('json')) return 'code';
    if (mimeType.includes('document') || mimeType.includes('text') || mimeType.includes('pdf')) return 'document';
    return 'other';
  },

  getSizeDisplayClass: (bytes: number): string => {
    if (bytes < 1024 * 1024) return 'text-green-600'; // < 1MB
    if (bytes < 10 * 1024 * 1024) return 'text-blue-600'; // < 10MB
    if (bytes < 100 * 1024 * 1024) return 'text-yellow-600'; // < 100MB
    return 'text-red-600'; // > 100MB
  }
};