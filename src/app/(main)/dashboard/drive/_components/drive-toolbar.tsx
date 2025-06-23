"use client";

import React, { useState, useEffect, useRef } from 'react';
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
  ChevronDown,
  X,
  ChevronUp
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

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
  className?: string;
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
  isLoading = false,
  className
}: DriveToolbarProps) {
  const isMobile = useIsMobile();
  const [isMinimized, setIsMinimized] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isScrollingUp, setIsScrollingUp] = useState(true);
  const toolbarRef = useRef<HTMLDivElement>(null);

  // Android-style scroll behavior - hide on scroll down, show on scroll up
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollingUp = currentScrollY < lastScrollY;
      const scrollDelta = Math.abs(currentScrollY - lastScrollY);
      
      // Only trigger changes on significant scroll movements (5px+)
      if (scrollDelta > 5) {
        setIsScrollingUp(scrollingUp);
        
        // Auto-minimize when scrolling down past 100px
        if (currentScrollY > 100 && !scrollingUp) {
          setIsMinimized(true);
        }
        // Auto-expand when scrolling up
        else if (scrollingUp) {
          setIsMinimized(false);
        }
      }
      
      setLastScrollY(currentScrollY);
    };

    const throttledScroll = throttle(handleScroll, 16); // 60fps
    window.addEventListener('scroll', throttledScroll, { passive: true });
    
    return () => window.removeEventListener('scroll', throttledScroll);
  }, [lastScrollY]);

  // Throttle function for smooth scrolling performance
  function throttle(func: Function, delay: number) {
    let timeoutId: NodeJS.Timeout;
    let lastExecTime = 0;
    return function (...args: any[]) {
      const currentTime = Date.now();
      
      if (currentTime - lastExecTime > delay) {
        func(...args);
        lastExecTime = currentTime;
      } else {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          func(...args);
          lastExecTime = Date.now();
        }, delay - (currentTime - lastExecTime));
      }
    };
  }

  const sortOptions = [
    { value: 'name', label: 'Name' },
    { value: 'modifiedTime', label: 'Modified' },
    { value: 'size', label: 'Size' },
    { value: 'createdTime', label: 'Created' }
  ];

  return (
    <div 
      ref={toolbarRef}
      className={cn(
        "sticky top-0 z-50 transition-all duration-300 ease-in-out",
        "bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80",
        "border-b shadow-sm",
        // Android-style behavior
        isScrollingUp ? "translate-y-0" : "-translate-y-2",
        isMinimized ? "shadow-lg" : "shadow-sm",
        className
      )}
    >
      {/* Minimized state - compact toolbar */}
      {isMinimized && (
        <div className="flex items-center justify-between p-2 border-b bg-background/98">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsMinimized(false)}
              className="h-8 w-8 p-0 touch-target active:scale-95"
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
            
            {selectedCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {selectedCount}
              </Badge>
            )}
            
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsSearchExpanded(!isSearchExpanded)}
              className="h-8 w-8 p-0 touch-target active:scale-95"
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={onRefresh}
              disabled={isLoading}
              className="h-8 w-8 p-0 touch-target active:scale-95"
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
            
            <Button
              size="sm"
              variant="ghost"
              onClick={onUpload}
              disabled={isLoading}
              className="h-8 w-8 p-0 touch-target active:scale-95"
            >
              <Upload className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Expanded search bar in minimized mode */}
      {isMinimized && isSearchExpanded && (
        <div className="p-2 border-b bg-background/98">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search files and folders..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 h-8"
              disabled={isLoading}
              autoFocus
            />
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsSearchExpanded(false)}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}

      {/* Full toolbar - only show when not minimized */}
      {!isMinimized && (
        <div className="flex flex-col gap-3 p-4">
      {/* Main toolbar row */}
      <div className="flex items-center justify-between gap-3">
        {/* Left: Primary actions */}
        <div className="flex items-center gap-2">
          <Button
            onClick={onUpload}
            className={cn("touch-target min-h-[44px] active:scale-95")}
            disabled={isLoading}
          >
            <Upload className="h-4 w-4 mr-2" />
            {isMobile ? 'Upload' : 'Upload Files'}
          </Button>
          
          <Button
            variant="outline"
            onClick={onCreateFolder}
            className={cn("touch-target min-h-[44px] active:scale-95")}
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
                    className={cn("touch-target min-h-[44px] active:scale-95")}
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
                    className={cn("touch-target min-h-[44px] active:scale-95")}
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
                    className={cn("touch-target min-h-[44px] active:scale-95")}
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
                className={cn("touch-target min-h-[44px] active:scale-95")}
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
                className={cn("touch-target min-h-[44px] active:scale-95")}
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
      )}

      {/* Minimize/Expand button - always visible */}
      <div className="absolute top-2 right-2">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setIsMinimized(!isMinimized)}
          className="h-6 w-6 p-0 touch-target active:scale-95 bg-background/80 hover:bg-background"
        >
          {isMinimized ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
        </Button>
      </div>
    </div>
  );
}