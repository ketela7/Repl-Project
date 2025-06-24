/**
 * Cache Configuration
 */

export const CACHE_CONFIG = {
  // Default TTL values in milliseconds
  ttl: {
    short: 5 * 60 * 1000,      // 5 minutes
    medium: 30 * 60 * 1000,    // 30 minutes
    long: 24 * 60 * 60 * 1000, // 24 hours
  },
  
  // Cache size limits
  limits: {
    maxSize: 500,              // Maximum number of entries
    maxMemory: 50 * 1024 * 1024, // 50MB in bytes
  },
  
  // Feature flags
  features: {
    compression: true,
    persistence: false,
    metrics: process.env.NODE_ENV === 'development',
  },
  
  // Cache key prefixes
  keys: {
    drive: 'drive:',
    session: 'session:',
    user: 'user:',
    files: 'files:',
  },
} as const;