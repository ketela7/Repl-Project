/**
 * Environment Configuration
 * Handles environment variables and runtime configuration
 */

export const config = {
  // Authentication
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  },

  // NextAuth
  nextAuth: {
    secret: process.env.NEXTAUTH_SECRET || '',
    url: process.env.NEXTAUTH_URL || '',
  },

  // Database
  database: {
    url: process.env.DATABASE_URL || '',
  },

  // Application
  app: {
    env: process.env.NODE_ENV || 'development',
    isDevelopment: process.env.NODE_ENV === 'development',
    isProduction: process.env.NODE_ENV === 'production',
    port: process.env.PORT || '5000',
  },

  // Replit specific
  replit: {
    slug: process.env.REPL_SLUG || '',
    owner: process.env.REPL_OWNER || '',
    id: process.env.REPL_ID || '',
  },
}
