"use client";

import React from 'react';
import { 
  FileText, 
  Folder, 
  FileCheck, 
  Palette, 
  BookOpen, 
  Music, 
  Archive,
  File,
  FileSpreadsheet,
  Presentation,
  FileImage,
  FileVideo,
  FileCode,
  Database,
  MapPin,
  Globe,
  Link,
  ExternalLink,
  FileType,
  FileAudio,
  Package,
  Zap,
  Terminal,
  Settings,
  Box,
  Monitor,
  Smartphone,
  Camera,
  Printer,
  HardDrive
} from 'lucide-react';
import { getFileIconProps } from '@/lib/google-drive/utils';

interface FileIconProps {
  mimeType: string;
  fileName?: string;
  className?: string;
  strokeWidth?: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function FileIcon({ 
  mimeType, 
  fileName,
  className, 
  strokeWidth = 2,
  size = 'md'
}: FileIconProps) {
  const { iconName, colorClass } = getFileIconProps(mimeType, fileName);
  
  // Size mapping for consistency
  const sizeMap = {
    'sm': 'h-3 w-3',
    'md': 'h-4 w-4', 
    'lg': 'h-8 w-8',
    'xl': 'h-6 w-6'
  };
  
  const sizeClass = sizeMap[size];
  const baseClasses = 'drop-shadow-sm transition-colors duration-200';
  const finalClassName = className ? 
    `${className} ${colorClass} ${baseClasses}` : 
    `${sizeClass} ${colorClass} ${baseClasses}`;
  
  const iconProps = {
    className: finalClassName,
    strokeWidth,
    'data-testid': 'file-icon'
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
    Archive,
    FileCode,
    Database,
    File,
    Music,
    MapPin,
    Globe,
    Link,
    FileType,
    FileAudio,
    Package,
    Zap,
    Terminal,
    Settings,
    Box,
    Monitor,
    Smartphone,
    Camera,
    Printer,
    HardDrive
  };

  const IconComponent = iconComponents[iconName] || File;
  
  return <IconComponent {...iconProps} />;
}

// Helper function that can be used in both client and server components
export function getFileIcon(mimeType: string, fileName?: string, className?: string) {
  return <FileIcon mimeType={mimeType} fileName={fileName} className={className} />;
}