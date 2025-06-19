"use client";

import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Video, 
  FileText, 
  Image, 
  Music, 
  Archive, 
  Code, 
  FileSpreadsheet,
  Presentation,
  File,
  Folder,
  Camera
} from "lucide-react";

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime: string;
}

interface FileCategoryBadgesProps {
  files: DriveFile[];
  folders: DriveFile[];
  onCategoryClick?: (category: string) => void;
  className?: string;
}

interface FileCategory {
  name: string;
  count: number;
  color: string;
  bgColor: string;
  textColor: string;
  icon: React.ReactNode;
  mimeTypes: string[];
}

const getCategoryFromMimeType = (mimeType: string): string => {
  // Video files
  if (mimeType.startsWith('video/') || 
      mimeType.includes('mp4') || 
      mimeType.includes('mov') || 
      mimeType.includes('avi') || 
      mimeType.includes('mkv') ||
      mimeType.includes('webm') ||
      mimeType.includes('flv') ||
      mimeType.includes('wmv')) {
    return 'Videos';
  }
  
  // Audio files
  if (mimeType.startsWith('audio/') || 
      mimeType.includes('mp3') || 
      mimeType.includes('wav') || 
      mimeType.includes('flac') ||
      mimeType.includes('aac') ||
      mimeType.includes('ogg') ||
      mimeType.includes('wma')) {
    return 'Audio';
  }
  
  // Image files
  if (mimeType.startsWith('image/') || 
      mimeType.includes('jpeg') || 
      mimeType.includes('jpg') || 
      mimeType.includes('png') ||
      mimeType.includes('gif') ||
      mimeType.includes('bmp') ||
      mimeType.includes('svg') ||
      mimeType.includes('webp') ||
      mimeType.includes('tiff')) {
    return 'Images';
  }
  
  // Document files
  if (mimeType.includes('document') || 
      mimeType.includes('pdf') || 
      mimeType.includes('msword') ||
      mimeType.includes('wordprocessingml') ||
      mimeType.includes('rtf') ||
      mimeType.includes('odt') ||
      mimeType.includes('pages')) {
    return 'Documents';
  }
  
  // Spreadsheet files
  if (mimeType.includes('spreadsheet') || 
      mimeType.includes('excel') || 
      mimeType.includes('sheet') ||
      mimeType.includes('csv') ||
      mimeType.includes('ods') ||
      mimeType.includes('numbers')) {
    return 'Spreadsheets';
  }
  
  // Presentation files
  if (mimeType.includes('presentation') || 
      mimeType.includes('powerpoint') || 
      mimeType.includes('ppt') ||
      mimeType.includes('odp') ||
      mimeType.includes('keynote')) {
    return 'Presentations';
  }
  
  // Archive files
  if (mimeType.includes('zip') || 
      mimeType.includes('rar') || 
      mimeType.includes('tar') ||
      mimeType.includes('gz') ||
      mimeType.includes('7z') ||
      mimeType.includes('archive')) {
    return 'Archives';
  }
  
  // Code files
  if (mimeType.includes('javascript') || 
      mimeType.includes('typescript') || 
      mimeType.includes('json') ||
      mimeType.includes('html') ||
      mimeType.includes('css') ||
      mimeType.includes('xml') ||
      mimeType.includes('yaml') ||
      mimeType.includes('python') ||
      mimeType.includes('java') ||
      mimeType.includes('cpp') ||
      mimeType.includes('php') ||
      mimeType.includes('ruby') ||
      mimeType.includes('sql')) {
    return 'Code';
  }
  
  // Default to Others
  return 'Others';
};

const getCategoryConfig = (categoryName: string): Omit<FileCategory, 'count' | 'mimeTypes'> => {
  const configs = {
    'Videos': {
      name: 'Videos',
      color: 'border-red-200 dark:border-red-800',
      bgColor: 'bg-red-50 dark:bg-red-950/50',
      textColor: 'text-red-700 dark:text-red-300',
      icon: <Video className="h-4 w-4" />
    },
    'Documents': {
      name: 'Documents', 
      color: 'border-blue-200 dark:border-blue-800',
      bgColor: 'bg-blue-50 dark:bg-blue-950/50',
      textColor: 'text-blue-700 dark:text-blue-300',
      icon: <FileText className="h-4 w-4" />
    },
    'Images': {
      name: 'Images',
      color: 'border-purple-200 dark:border-purple-800', 
      bgColor: 'bg-purple-50 dark:bg-purple-950/50',
      textColor: 'text-purple-700 dark:text-purple-300',
      icon: <Image className="h-4 w-4" />
    },
    'Audio': {
      name: 'Audio',
      color: 'border-orange-200 dark:border-orange-800',
      bgColor: 'bg-orange-50 dark:bg-orange-950/50', 
      textColor: 'text-orange-700 dark:text-orange-300',
      icon: <Music className="h-4 w-4" />
    },
    'Spreadsheets': {
      name: 'Spreadsheets',
      color: 'border-green-200 dark:border-green-800',
      bgColor: 'bg-green-50 dark:bg-green-950/50',
      textColor: 'text-green-700 dark:text-green-300', 
      icon: <FileSpreadsheet className="h-4 w-4" />
    },
    'Presentations': {
      name: 'Presentations',
      color: 'border-yellow-200 dark:border-yellow-800',
      bgColor: 'bg-yellow-50 dark:bg-yellow-950/50',
      textColor: 'text-yellow-700 dark:text-yellow-300',
      icon: <Presentation className="h-4 w-4" />
    },
    'Archives': {
      name: 'Archives',
      color: 'border-gray-200 dark:border-gray-700',
      bgColor: 'bg-gray-50 dark:bg-gray-950/50',
      textColor: 'text-gray-700 dark:text-gray-300',
      icon: <Archive className="h-4 w-4" />
    },
    'Code': {
      name: 'Code',
      color: 'border-indigo-200 dark:border-indigo-800',
      bgColor: 'bg-indigo-50 dark:bg-indigo-950/50',
      textColor: 'text-indigo-700 dark:text-indigo-300',
      icon: <Code className="h-4 w-4" />
    },
    'Others': {
      name: 'Others',
      color: 'border-slate-200 dark:border-slate-700',
      bgColor: 'bg-slate-50 dark:bg-slate-950/50',
      textColor: 'text-slate-700 dark:text-slate-300',
      icon: <File className="h-4 w-4" />
    },
    'Folders': {
      name: 'Folders',
      color: 'border-cyan-200 dark:border-cyan-800',
      bgColor: 'bg-cyan-50 dark:bg-cyan-950/50',
      textColor: 'text-cyan-700 dark:text-cyan-300',
      icon: <Folder className="h-4 w-4" />
    }
  };
  
  return configs[categoryName as keyof typeof configs] || configs['Others'];
};

export function FileCategoryBadges({ 
  files, 
  folders, 
  onCategoryClick, 
  className = "" 
}: FileCategoryBadgesProps) {
  const categories = React.useMemo(() => {
    // Count files by category
    const fileCounts = files.reduce((acc, file) => {
      const category = getCategoryFromMimeType(file.mimeType);
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Add folders if they exist
    if (folders.length > 0) {
      fileCounts['Folders'] = folders.length;
    }
    
    // Convert to category objects and sort by count (descending)
    return Object.entries(fileCounts)
      .map(([categoryName, count]) => ({
        ...getCategoryConfig(categoryName),
        count,
        mimeTypes: [] // We don't need to track specific mime types here
      }))
      .sort((a, b) => b.count - a.count);
  }, [files, folders]);

  if (categories.length === 0) {
    return null;
  }

  return (
    <Card className={`${className}`}>
      <CardContent className="p-4">
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <Badge
              key={category.name}
              variant="outline"
              className={`
                px-3 py-2 cursor-pointer transition-all duration-200 hover:scale-105 
                ${category.color} ${category.bgColor} ${category.textColor}
                border-2 rounded-full font-medium text-sm
                flex items-center gap-2 min-w-fit
              `}
              onClick={() => onCategoryClick?.(category.name)}
            >
              {category.icon}
              <span className="whitespace-nowrap">
                {category.name} {category.count}
              </span>
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default FileCategoryBadges;