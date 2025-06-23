"use client";

import React from 'react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Info, 
  Copy, 
  Download, 
  Upload,
  Share2,
  Trash2,
  FolderPlus,
  Loader2 
} from 'lucide-react';

interface EnhancedToastProps {
  type: 'success' | 'error' | 'warning' | 'info' | 'loading';
  title: string;
  description?: string;
  icon?: React.ReactNode;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Unused toast functions removed