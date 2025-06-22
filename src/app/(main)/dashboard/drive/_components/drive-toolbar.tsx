"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { 
  Upload,
  FolderPlus,
  Search,
  RefreshCw,
  Grid3X3,
  List,
  Settings,
  Download,
  Trash2,
  Share,
  MoreVertical,
  SlidersHorizontal,
  ChevronDown
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { getTouchButtonClasses } from "@/lib/mobile-optimization";

interface DriveToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onRefresh: () => void;
  onUpload: () => void;
  onCreateFolder: () => void;
  viewMode: 'list' | 'grid';
  onViewModeChange: (mode: 'list' | 'grid') => void;
  selectedCount: number;
  onBulkDownload?: () => void;
  onBulkDelete?: () => void;
  onBulkShare?: () => void;
  onShowFilters?: () => void;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSortChange: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  isLoading?: boolean;
}

export function DriveToolbar({
  searchQuery,
  onSearchChange,
  onRefresh,
  onUpload,
  onCreateFolder,
  viewMode,
  onViewModeChange,
  selectedCount,
  onBulkDownload,
  onBulkDelete,
  onBulkShare,
  onShowFilters,
  sortBy,
  sortOrder,
  onSortChange,
  isLoading = false
}: DriveToolbarProps) {
  const isMobile = useIsMobile();

  const sortOptions = [
    { value: 'name', label: 'Name' },
    { value: 'modifiedTime', label: 'Modified' },
    { value: 'size', label: 'Size' },
    { value: 'createdTime', label: 'Created' }
  ];

  return (
    <div className="flex flex-col gap-3 p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Main toolbar row */}
      <div className="flex items-center justify-between gap-3">
        {/* Left: Primary actions */}
        <div className="flex items-center gap-2">
          <Button
            onClick={onUpload}
            className={getTouchButtonClasses('default')}
            disabled={isLoading}
          >
            <Upload className="h-4 w-4 mr-2" />
            {isMobile ? 'Upload' : 'Upload Files'}
          </Button>
          
          <Button
            variant="outline"
            onClick={onCreateFolder}
            className={getTouchButtonClasses('default')}
            disabled={isLoading}
          >
            <FolderPlus className="h-4 w-4 mr-2" />
            {isMobile ? 'Folder' : 'New Folder'}
          </Button>
        </div>

        {/* Right: View controls */}
        <div className="flex items-center gap-2">
          {/* Bulk actions when items selected */}
          {selectedCount > 0 && (
            <>
              <Badge variant="secondary" className="hidden sm:flex">
                {selectedCount} selected
              </Badge>
              
              <div className="flex items-center gap-1">
                {onBulkDownload && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onBulkDownload}
                    className={getTouchButtonClasses('sm')}
                  >
                    <Download className="h-4 w-4" />
                    {!isMobile && <span className="ml-1">Download</span>}
                  </Button>
                )}
                
                {onBulkShare && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onBulkShare}
                    className={getTouchButtonClasses('sm')}
                  >
                    <Share className="h-4 w-4" />
                    {!isMobile && <span className="ml-1">Share</span>}
                  </Button>
                )}
                
                {onBulkDelete && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onBulkDelete}
                    className={getTouchButtonClasses('sm')}
                  >
                    <Trash2 className="h-4 w-4" />
                    {!isMobile && <span className="ml-1">Delete</span>}
                  </Button>
                )}
              </div>
            </>
          )}

          {/* Sort dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                size="sm"
                className={getTouchButtonClasses('sm')}
              >
                <span className="hidden sm:inline">Sort:</span>
                <span className="capitalize">
                  {sortOptions.find(opt => opt.value === sortBy)?.label}
                </span>
                <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {sortOptions.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => onSortChange(option.value, sortOrder)}
                  className="flex items-center justify-between"
                >
                  {option.label}
                  {sortBy === option.value && (
                    <span className="text-xs">
                      {sortOrder === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onSortChange(sortBy, sortOrder === 'asc' ? 'desc' : 'asc')}
              >
                {sortOrder === 'asc' ? 'Sort Descending' : 'Sort Ascending'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* View mode toggle */}
          <ToggleGroup
            type="single"
            value={viewMode}
            onValueChange={(value) => value && onViewModeChange(value as 'list' | 'grid')}
            className="hidden sm:flex"
          >
            <ToggleGroupItem value="list" aria-label="List view">
              <List className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="grid" aria-label="Grid view">
              <Grid3X3 className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>

          {/* More options */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                size="sm"
                className={getTouchButtonClasses('sm')}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onRefresh} disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </DropdownMenuItem>
              {onShowFilters && (
                <DropdownMenuItem onClick={onShowFilters}>
                  <SlidersHorizontal className="h-4 w-4 mr-2" />
                  Advanced Filters
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem className="sm:hidden" onClick={() => onViewModeChange(viewMode === 'list' ? 'grid' : 'list')}>
                {viewMode === 'list' ? <Grid3X3 className="h-4 w-4 mr-2" /> : <List className="h-4 w-4 mr-2" />}
                {viewMode === 'list' ? 'Grid View' : 'List View'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search files and folders..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
          disabled={isLoading}
        />
      </div>
    </div>
  );
}