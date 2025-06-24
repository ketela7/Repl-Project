/**
 * Application Configuration
 * Centralized configuration for the Google Drive Management Application
 */

export const APP_CONFIG = {
  name: 'Google Drive Pro',
  version: '2.0.0',
  description: 'Professional Google Drive Management Application',
  
  // API Configuration
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || '/api',
    timeout: 30000,
    retries: 3,
  },
  
  // Feature Flags
  features: {
    bulkOperations: true,
    analytics: true,
    advancedSearch: true,
    filePreview: true,
  },
  
  // UI Configuration
  ui: {
    defaultPageSize: 50,
    maxPageSize: 100,
    animationDuration: 300,
    toastDuration: 5000,
  },
  
  // File Handling
  files: {
    maxUploadSize: 100 * 1024 * 1024, // 100MB
    allowedTypes: [
      'image/*',
      'video/*',
      'audio/*',
      'application/pdf',
      'text/*',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
    thumbnailSize: 150,
  },
  
  // Cache Configuration
  cache: {
    defaultTTL: 5 * 60 * 1000, // 5 minutes
    maxSize: 100,
    enableCompression: true,
  },
} as const;