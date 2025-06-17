import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getInitials = (str: string): string => {
  if (typeof str !== "string" || !str.trim()) return "?";

  return (
    str
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((word) => word[0])
      .join("")
      .toUpperCase() || "?"
  );
};

/**
 * Enhanced file size formatter with cross-platform compatibility
 * Extended from existing utility pattern
 */
export function formatFileSize(bytes: number, options: {
  type?: 'file' | 'storage' | 'bandwidth';
  precision?: number;
  locale?: string;
  binary?: boolean;
} = {}): string {
  const { type = 'file', precision = 1, locale = 'en-US', binary = false } = options;
  
  if (bytes === 0) return '0 B';
  
  const base = binary ? 1024 : 1000;
  const units = binary 
    ? ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB']
    : ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(base));
  const size = bytes / Math.pow(base, i);
  
  // Enhanced formatting for different contexts
  const formatter = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: precision,
  });
  
  return `${formatter.format(size)} ${units[i]}`;
}

/**
 * Enhanced date formatter with localization support
 * Extended utility for cross-platform date handling
 */
export function formatDate(date: Date | string | number, options: {
  format?: 'short' | 'medium' | 'long' | 'relative';
  locale?: string;
  timeZone?: string;
} = {}): string {
  const { format = 'medium', locale = 'en-US', timeZone } = options;
  const dateObj = new Date(date);
  
  if (isNaN(dateObj.getTime())) return 'Invalid date';
  
  if (format === 'relative') {
    const now = new Date();
    const diffMs = now.getTime() - dateObj.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  }
  
  const formatOptions: Intl.DateTimeFormatOptions = {
    timeZone,
    ...(format === 'short' && { 
      month: 'short', 
      day: 'numeric', 
      year: '2-digit' 
    }),
    ...(format === 'medium' && { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    }),
    ...(format === 'long' && { 
      weekday: 'long',
      month: 'long', 
      day: 'numeric', 
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit'
    }),
  };
  
  return new Intl.DateTimeFormat(locale, formatOptions).format(dateObj);
}

/**
 * Simple device detection utilities
 * Basic responsive helpers
 */
export const deviceUtils = {
  isMobile: () => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 768;
  },
  
  isTablet: () => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth >= 768 && window.innerWidth < 1024;
  },
  
  isDesktop: () => {
    if (typeof window === 'undefined') return true;
    return window.innerWidth >= 1024;
  },
  
  isTouchDevice: () => {
    if (typeof window === 'undefined') return false;
    return 'ontouchstart' in window;
  }
};

/**
 * Professional error handling utility
 * Enhanced error formatting for user-friendly messages
 */
export function formatError(error: unknown, context?: string): string {
  let message = 'An unexpected error occurred';
  
  if (error instanceof Error) {
    message = error.message;
  } else if (typeof error === 'string') {
    message = error;
  } else if (error && typeof error === 'object' && 'message' in error) {
    message = String(error.message);
  }
  
  // Clean up technical error messages for user display
  const cleanMessage = message
    .replace(/^Error:\s*/i, '')
    .replace(/^\w+Error:\s*/i, '')
    .trim();
  
  return context ? `${context}: ${cleanMessage}` : cleanMessage;
}
