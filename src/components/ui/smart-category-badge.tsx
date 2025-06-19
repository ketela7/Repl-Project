
import React from 'react';
import { Badge } from './badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip';
import { SmartCategory } from '@/lib/google-drive/types';
import { 
  FileText, 
  Image, 
  Video, 
  Music, 
  Code, 
  Archive, 
  Palette, 
  Database, 
  Settings, 
  Folder,
  Sparkles
} from 'lucide-react';

interface SmartCategoryBadgeProps {
  category: SmartCategory;
  showTooltip?: boolean;
  className?: string;
}

const categoryIcons = {
  'document': FileText,
  'media': Image,
  'video': Video,
  'audio': Music,
  'development': Code,
  'archive': Archive,
  'design': Palette,
  'data': Database,
  'configuration': Settings,
  'folder': Folder,
  'other': FileText
};

const categoryColors = {
  'document': 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800',
  'media': 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800',
  'development': 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800',
  'archive': 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800',
  'design': 'bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-950 dark:text-pink-300 dark:border-pink-800',
  'data': 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950 dark:text-cyan-300 dark:border-cyan-800',
  'folder': 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-800',
  'other': 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-950 dark:text-gray-300 dark:border-gray-800'
};

export function SmartCategoryBadge({ category, showTooltip = true, className }: SmartCategoryBadgeProps) {
  const Icon = categoryIcons[category.primary as keyof typeof categoryIcons] || FileText;
  const colorClass = categoryColors[category.primary as keyof typeof categoryColors] || categoryColors.other;
  
  const getConfidenceText = (confidence: number) => {
    if (confidence >= 0.9) return 'Very High';
    if (confidence >= 0.7) return 'High';
    if (confidence >= 0.5) return 'Medium';
    return 'Low';
  };

  const badge = (
    <Badge 
      variant="outline" 
      className={`text-xs ${colorClass} ${className}`}
    >
      <Icon className="h-3 w-3 mr-1" />
      {category.primary}
      {category.secondary && (
        <span className="ml-1 opacity-75">
          • {category.secondary}
        </span>
      )}
      <Sparkles className="h-2 w-2 ml-1 opacity-60" />
    </Badge>
  );

  if (!showTooltip) return badge;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {badge}
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1 text-xs">
            <div className="font-medium">Smart Category</div>
            <div>Category: {category.primary}</div>
            {category.secondary && <div>Type: {category.secondary}</div>}
            <div>Confidence: {getConfidenceText(category.confidence)}</div>
            <div className="text-muted-foreground">{category.reason}</div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
