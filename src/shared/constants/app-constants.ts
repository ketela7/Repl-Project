/**
 * App Constants - Application-wide constants
 */

export const APP_NAME = 'Google Drive Pro';
export const APP_VERSION = '2.0.0';

export const DEFAULT_PAGE_SIZE = 50;
export const MAX_FILE_SIZE_MB = 100;

export const SUPPORTED_FILE_TYPES = [
  'image/*',
  'video/*',
  'audio/*',
  'application/pdf',
  'text/*',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const;

export const CACHE_DURATION = {
  short: 5 * 60 * 1000, // 5 minutes
  medium: 30 * 60 * 1000, // 30 minutes
  long: 24 * 60 * 60 * 1000, // 24 hours
} as const;

export const APP_CONFIG = {
  name: APP_NAME,
  version: APP_VERSION,
  description: "Professional Google Drive Management",
  
  meta: {
    title: "Google Drive Pro - Professional Drive Management",
    description: "Advanced Google Drive management application with enterprise features",
  },
  
  ui: {
    pageSize: DEFAULT_PAGE_SIZE,
    maxFileSize: MAX_FILE_SIZE_MB * 1024 * 1024,
    supportedFormats: SUPPORTED_FILE_TYPES,
  },
  
  api: {
    timeout: 30000,
    retryAttempts: 3,
    batchSize: 25,
  },
  
  cache: CACHE_DURATION
};