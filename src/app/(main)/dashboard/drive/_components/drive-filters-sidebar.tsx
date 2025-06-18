
"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
  Filter,
  ChevronDown,
  ChevronUp,
  X
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

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
  
  const [isExpanded, setIsExpanded] = useState(false);

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

  const removeFileTypeFilter = (fileTypeKey: string) => {
    const newFilter = fileTypeFilter.filter(type => type !== fileTypeKey);
    onFileTypeChange(newFilter);
  };

  const hasActiveFilters = activeView !== 'all' || fileTypeFilter.length > 0;

  return (
    <Card className="border-primary/20 bg-gradient-to-r from-background to-accent/5">
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Header with Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-lg">Smart Filters</h3>
              </div>
              
              {hasActiveFilters && (
                <Badge variant="secondary" className="text-xs px-2 py-1">
                  {(activeView !== 'all' ? 1 : 0) + fileTypeFilter.length} active
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2">
              {hasActiveFilters && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearAllFilters}
                  className="text-xs h-7 px-2 text-destructive hover:bg-destructive/10"
                >
                  <X className="h-3 w-3 mr-1" />
                  Clear All
                </Button>
              )}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-7 px-2"
              >
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Quick View Filters - Always Visible */}
          <div className="flex flex-wrap gap-2">
            {viewOptions.map(({ key, label, icon: Icon }) => {
              const isActive = activeView === key;
              return (
                <Button
                  key={key}
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  onClick={() => onViewChange(key as any)}
                  className={`h-8 px-3 text-xs transition-all duration-200 ${
                    isActive 
                      ? 'bg-primary text-primary-foreground shadow-sm scale-105' 
                      : 'hover:bg-accent hover:scale-105'
                  }`}
                >
                  <Icon className="h-3 w-3 mr-2" />
                  {label}
                  {isActive && <div className="ml-1 w-1 h-1 bg-primary-foreground rounded-full" />}
                </Button>
              );
            })}
          </div>

          {/* Active Filters Summary */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm font-medium text-muted-foreground">Active:</span>
              {activeView !== 'all' && (
                <Badge 
                  variant="secondary" 
                  className="text-xs px-2 py-1 bg-primary/10 text-primary border-primary/20"
                >
                  {viewOptions.find(v => v.key === activeView)?.label}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onViewChange('all')}
                    className="ml-1 h-3 w-3 p-0 hover:bg-destructive/20"
                  >
                    <X className="h-2 w-2" />
                  </Button>
                </Badge>
              )}
              {fileTypeFilter.map(type => (
                <Badge 
                  key={type} 
                  variant="outline" 
                  className="text-xs px-2 py-1 bg-accent/50 hover:bg-accent"
                >
                  {fileTypeOptions.find(ft => ft.key === type)?.label}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFileTypeFilter(type)}
                    className="ml-1 h-3 w-3 p-0 hover:bg-destructive/20"
                  >
                    <X className="h-2 w-2" />
                  </Button>
                </Badge>
              ))}
            </div>
          )}

          {/* Expanded File Type Filters */}
          {isExpanded && (
            <>
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <File className="h-4 w-4 text-primary" />
                  <span className="font-medium text-sm">File Types</span>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                  {fileTypeOptions.map(({ key, label, icon: Icon }) => {
                    const isActive = fileTypeFilter.includes(key);
                    return (
                      <div 
                        key={key} 
                        className={`flex items-center space-x-2 p-2 rounded-md border transition-all duration-200 cursor-pointer hover:bg-accent hover:scale-105 ${
                          isActive 
                            ? 'bg-primary/10 border-primary/30 shadow-sm' 
                            : 'border-border hover:border-primary/20'
                        }`}
                        onClick={() => handleFileTypeToggle(key)}
                      >
                        <Checkbox
                          id={key}
                          checked={isActive}
                          onCheckedChange={() => handleFileTypeToggle(key)}
                          className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                        />
                        <div className="flex items-center space-x-2 flex-1 min-w-0">
                          <Icon className={`h-4 w-4 flex-shrink-0 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                          <label 
                            htmlFor={key} 
                            className={`text-xs font-medium cursor-pointer truncate ${
                              isActive ? 'text-primary' : 'text-foreground'
                            }`}
                          >
                            {label}
                          </label>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
