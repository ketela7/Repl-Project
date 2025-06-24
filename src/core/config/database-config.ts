/**
 * Database Configuration
 */

export const DATABASE_CONFIG = {
  url: process.env.DATABASE_URL || '',
  
  // Connection Pool Settings
  pool: {
    min: 2,
    max: 10,
    acquireTimeoutMillis: 30000,
    idleTimeoutMillis: 30000,
  },
  
  // Migration Settings
  migrations: {
    directory: './drizzle',
    tableName: 'migrations',
  },
  
  // Logging
  logging: process.env.NODE_ENV === 'development',
} as const;