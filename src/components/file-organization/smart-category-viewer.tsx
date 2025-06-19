"use client";

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import {
  Brain,
  FileText,
  Image,
  Video,
  Music,
  Archive,
  Code,
  Folder,
  Search,
  Filter,
  BarChart3,
  Layers,
  Eye,
  Sparkles
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getSmartCategory, generateAutoTags } from '@/lib/google-drive/utils';
import { SmartCategoryBadge } from '@/components/ui/smart-category-badge';
import { FileIcon } from '@/components/file-icon';

interface SmartCategoryViewerProps {
  files: Array<{
    id: string;
    name: string;
    mimeType: string;
    size?: string;
    modifiedTime?: string;
  }>;
  onFileSelect?: (fileIds: string[]) => void;
  className?: string;
}

interface CategoryStats {
  category: string;
  count: number;
  percentage: number;
  confidence: number;
  files: any[];
}

export function SmartCategoryViewer({ 
  files, 
  onFileSelect, 
  className 
}: SmartCategoryViewerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'confidence' | 'size' | 'date'>('confidence');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Process files with smart categorization
  const processedFiles = useMemo(() => {
    return files.map(file => {
      const category = getSmartCategory(file);
      const autoTags = generateAutoTags(file);
      return {
        ...file,
        category,
        autoTags,
        searchableText: `${file.name} ${category.primary} ${category.secondary || ''} ${autoTags.join(' ')}`.toLowerCase()
      };
    });
  }, [files]);

  // Calculate category statistics
  const categoryStats = useMemo(() => {
    const stats = new Map<string, CategoryStats>();
    
    processedFiles.forEach(file => {
      const categoryKey = file.category.primary;
      if (!stats.has(categoryKey)) {
        stats.set(categoryKey, {
          category: categoryKey,
          count: 0,
          percentage: 0,
          confidence: 0,
          files: []
        });
      }
      
      const stat = stats.get(categoryKey)!;
      stat.count++;
      stat.confidence += file.category.confidence;
      stat.files.push(file);
    });

    const totalFiles = processedFiles.length;
    const result = Array.from(stats.values()).map(stat => ({
      ...stat,
      percentage: (stat.count / totalFiles) * 100,
      confidence: stat.confidence / stat.count
    }));

    return result.sort((a, b) => b.count - a.count);
  }, [processedFiles]);

  // Filter and sort files
  const filteredFiles = useMemo(() => {
    let filtered = processedFiles;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(file => 
        file.searchableText.includes(searchTerm.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(file => 
        file.category.primary === selectedCategory
      );
    }

    // Sort files
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'confidence':
          return b.category.confidence - a.category.confidence;
        case 'size':
          const sizeA = parseInt(a.size || '0');
          const sizeB = parseInt(b.size || '0');
          return sizeB - sizeA;
        case 'date':
          return new Date(b.modifiedTime || 0).getTime() - new Date(a.modifiedTime || 0).getTime();
        default:
          return 0;
      }
    });

    return filtered;
  }, [processedFiles, searchTerm, selectedCategory, sortBy]);

  const getCategoryIcon = (category: string) => {
    const icons = {
      'document': FileText,
      'media': Image,
      'video': Video,
      'audio': Music,
      'archive': Archive,
      'development': Code,
      'folder': Folder,
      'design': Layers,
      'data': BarChart3
    };
    return icons[category as keyof typeof icons] || FileText;
  };

  const handleFileClick = (file: any) => {
    if (onFileSelect) {
      onFileSelect([file.id]);
    }
  };

  const handleCategoryFilter = (category: string) => {
    setSelectedCategory(category);
    if (onFileSelect && category !== 'all') {
      const categoryFiles = processedFiles
        .filter(f => f.category.primary === category)
        .map(f => f.id);
      onFileSelect(categoryFiles);
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Smart File Categorization
            <Badge variant="secondary" className="ml-auto">
              {processedFiles.length} files analyzed
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search files and categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={selectedCategory} onValueChange={handleCategoryFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categoryStats.map((stat) => (
                  <SelectItem key={stat.category} value={stat.category}>
                    {stat.category} ({stat.count})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className="w-full sm:w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="confidence">Confidence</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="size">Size</SelectItem>
                <SelectItem value="date">Date</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Category Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Category Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {categoryStats.map((stat) => {
              const Icon = getCategoryIcon(stat.category);
              return (
                <div key={stat.category} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      <span className="text-sm font-medium capitalize">
                        {stat.category}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {stat.count}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{stat.percentage.toFixed(1)}%</span>
                      <Badge 
                        variant={stat.confidence > 0.8 ? "default" : stat.confidence > 0.6 ? "secondary" : "outline"}
                        className="text-xs"
                      >
                        {(stat.confidence * 100).toFixed(0)}% confidence
                      </Badge>
                    </div>
                  </div>
                  <Progress value={stat.percentage} className="h-2" />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Files Grid/List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Categorized Files ({filteredFiles.length})
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Layers className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <Eye className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredFiles.map((file) => (
                  <div
                    key={file.id}
                    className="p-4 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => handleFileClick(file)}
                  >
                    <div className="flex items-start gap-3">
                      <FileIcon mimeType={file.mimeType} className="h-8 w-8 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" title={file.name}>
                          {file.name}
                        </p>
                        <div className="mt-2">
                          <SmartCategoryBadge category={file.category} showTooltip={false} />
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {file.autoTags.slice(0, 2).map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {file.autoTags.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{file.autoTags.length - 2}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center gap-4 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => handleFileClick(file)}
                  >
                    <FileIcon mimeType={file.mimeType} className="h-6 w-6 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">
                          {file.size && `${Math.round(parseInt(file.size) / 1024)} KB`}
                        </span>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">
                          {(file.category.confidence * 100).toFixed(0)}% confidence
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <SmartCategoryBadge category={file.category} showTooltip={false} />
                      <div className="flex gap-1">
                        {file.autoTags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      {selectedCategory !== 'all' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Quick Actions for {selectedCategory}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline">
                Create Folder
              </Button>
              <Button size="sm" variant="outline">
                Bulk Tag
              </Button>
              <Button size="sm" variant="outline">
                Export List
              </Button>
              <Button size="sm" variant="outline">
                Share Selection
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}