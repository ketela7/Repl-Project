/**
 * Server-side configuration for environment variables
 * Handles both Replit secrets and traditional environment variables
 */
export const config = {
  supabase: {
    url: process.env.SUPABASE_URL!,
    anonKey: process.env.SUPABASE_ANON_KEY!,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  },
  google: {
    driveScopes: 'https://www.googleapis.com/auth/drive',
  },
  app: {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: process.env.PORT || '3000',
    baseUrl: process.env.REPLIT_DOMAINS?.split(',')[0] || 'localhost:3000',
  },
}

/**
 * Public configuration for client-side components
 * These values are safe to expose to the browser
 */
export const getPublicConfig = () => ({
  supabaseUrl: process.env.SUPABASE_URL!,
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY!,
  appEnv: config.app.nodeEnv,
  baseUrl: config.app.baseUrl,
})

/**
 * Validates required environment variables
 */
export const validateConfig = () => {
  const requiredVars = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY', 
  ];

  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
};