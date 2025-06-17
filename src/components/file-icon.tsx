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
}

export function FileIcon({ mimeType, className = "h-4 w-4", strokeWidth = 2 }: FileIconProps) {
  const iconName = getFileIconName(mimeType);
  const colorClass = getFileIconColor(mimeType);
  
  const iconProps = {
    className: `${className} ${colorClass} drop-shadow-sm`,
    strokeWidth
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

// Helper function that can be used in both client and server components
export function getFileIcon(mimeType: string, className?: string) {
  return <FileIcon mimeType={mimeType} className={className} />;
}