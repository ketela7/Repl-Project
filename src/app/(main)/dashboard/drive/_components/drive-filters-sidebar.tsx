
"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Home,
  Share,
  Star,
  Clock,
  Trash2,
  Folder,
  FileText,
  Image,
  Video,
  Music,
  Archive,
  File,
  Users,
  Filter
} from "lucide-react";

interface DriveFiltersSidebarProps {
  activeView: 'all' | 'my-drive' | 'shared' | 'starred' | 'recent' | 'trash';
  fileTypeFilter: string[];
  onViewChange: (view: 'all' | 'my-drive' | 'shared' | 'starred' | 'recent' | 'trash') => void;
  onFileTypeChange: (fileTypes: string[]) => void;
  isCollapsed?: boolean;
}

const viewOptions = [
  { key: 'all', label: 'All Files', icon: Home, description: 'All accessible files' },
  { key: 'my-drive', label: 'My Drive', icon: Folder, description: 'Files I own' },
  { key: 'shared', label: 'Shared with Me', icon: Share, description: 'Files shared by others' },
  { key: 'starred', label: 'Starred', icon: Star, description: 'Favorite files' },
  { key: 'recent', label: 'Recent', icon: Clock, description: 'Recently accessed' },
  { key: 'trash', label: 'Trash', icon: Trash2, description: 'Deleted files' },
] as const;

const fileTypeOptions = [
  { key: 'folders', label: 'Folders', icon: Folder, mimeTypes: ['application/vnd.google-apps.folder'] },
  { key: 'documents', label: 'Documents', icon: FileText, 
    mimeTypes: ['application/vnd.google-apps.document', 'application/pdf', 'text/plain', 'application/msword'] },
  { key: 'spreadsheets', label: 'Spreadsheets', icon: FileText, 
    mimeTypes: ['application/vnd.google-apps.spreadsheet', 'application/vnd.ms-excel'] },
  { key: 'presentations', label: 'Presentations', icon: FileText, 
    mimeTypes: ['application/vnd.google-apps.presentation', 'application/vnd.ms-powerpoint'] },
  { key: 'images', label: 'Images', icon: Image, 
    mimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'] },
  { key: 'videos', label: 'Videos', icon: Video, 
    mimeTypes: ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/webm'] },
  { key: 'audio', label: 'Audio', icon: Music, 
    mimeTypes: ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/ogg'] },
  { key: 'archives', label: 'Archives', icon: Archive, 
    mimeTypes: ['application/zip', 'application/x-rar', 'application/x-tar', 'application/gzip'] },
];

export function DriveFiltersSidebar({ 
  activeView, 
  fileTypeFilter, 
  onViewChange, 
  onFileTypeChange,
  isCollapsed = false 
}: DriveFiltersSidebarProps) {
  
  const handleFileTypeToggle = (fileTypeKey: string) => {
    const newFilter = fileTypeFilter.includes(fileTypeKey)
      ? fileTypeFilter.filter(type => type !== fileTypeKey)
      : [...fileTypeFilter, fileTypeKey];
    onFileTypeChange(newFilter);
  };

  const clearAllFilters = () => {
    onViewChange('all');
    onFileTypeChange([]);
  };

  if (isCollapsed) {
    return (
      <div className="w-12 p-2 space-y-2">
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-full p-2 h-10"
          title="Filters"
        >
          <Filter className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="w-64 p-4 space-y-4 border-r bg-card">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm">Filters</h3>
        </div>
        {(activeView !== 'all' || fileTypeFilter.length > 0) && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearAllFilters}
            className="text-xs h-6 px-2"
          >
            Clear
          </Button>
        )}
      </div>

      {/* Active Filters Summary */}
      {(activeView !== 'all' || fileTypeFilter.length > 0) && (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-1">
            {activeView !== 'all' && (
              <Badge variant="secondary" className="text-xs">
                {viewOptions.find(v => v.key === activeView)?.label}
              </Badge>
            )}
            {fileTypeFilter.map(type => (
              <Badge key={type} variant="outline" className="text-xs">
                {fileTypeOptions.find(ft => ft.key === type)?.label}
              </Badge>
            ))}
          </div>
          <Separator />
        </div>
      )}

      {/* View Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Folder className="h-4 w-4" />
            Views
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 pt-0">
          {viewOptions.map(({ key, label, icon: Icon, description }) => (
            <Button
              key={key}
              variant={activeView === key ? "secondary" : "ghost"}
              className="w-full justify-start h-8 px-3 text-sm"
              onClick={() => onViewChange(key as any)}
            >
              <Icon className="h-4 w-4 mr-3 flex-shrink-0" />
              <div className="flex-1 text-left">
                <div className="font-medium">{label}</div>
                {activeView === key && (
                  <div className="text-xs text-muted-foreground truncate">
                    {description}
                  </div>
                )}
              </div>
              {activeView === key && (
                <div className="ml-2">
                  <div className="w-2 h-2 bg-primary rounded-full" />
                </div>
              )}
            </Button>
          ))}
        </CardContent>
      </Card>

      {/* File Type Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <File className="h-4 w-4" />
            File Types
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          {fileTypeOptions.map(({ key, label, icon: Icon }) => (
            <div key={key} className="flex items-center space-x-3">
              <Checkbox
                id={key}
                checked={fileTypeFilter.includes(key)}
                onCheckedChange={() => handleFileTypeToggle(key)}
                className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
              <label 
                htmlFor={key} 
                className="flex items-center space-x-2 text-sm font-medium cursor-pointer flex-1"
              >
                <Icon className="h-4 w-4 text-muted-foreground" />
                <span>{label}</span>
              </label>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
