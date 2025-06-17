/**
 * Server-side configuration for environment variables
 * Handles Replit secrets without NEXT_PUBLIC_ prefixes
 */
export const config = {
  supabase: {
    url: process.env.SUPABASE_URL!,
    anonKey: process.env.SUPABASE_ANON_KEY!,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  },
  turnstile: {
    siteKey: process.env.TURNSTILE_SITE_KEY!,
    secretKey: process.env.TURNSTILE_SECRET_KEY!,
  },
  google: {
    driveScopes: 'https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/drive.file',
  },
  app: {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: process.env.PORT || '3000',
    baseUrl: getBaseUrl(),
    isDevelopment: process.env.NODE_ENV === 'development',
    isProduction: process.env.NODE_ENV === 'production',
  },
}

/**
 * Enhanced base URL detection for cross-platform compatibility
 */
function getBaseUrl(): string {
  // Production: Use REPLIT_DOMAINS or custom domain
  if (process.env.NODE_ENV === 'production') {
    const replitDomain = process.env.REPLIT_DOMAINS?.split(',')[0];
    if (replitDomain) {
      return `https://${replitDomain}`;
    }
  }

  // Development: Support various local environments
  const host = process.env.HOST || 'localhost';
  const port = process.env.PORT || '3000';
  
  // Handle different development scenarios
  if (host.includes('replit') || host.includes('.repl.co')) {
    return `https://${host}`;
  }
  
  return `http://${host}:${port}`;
}

/**
 * Public configuration for client-side components
 * Enhanced for cross-platform compatibility
 */
export const getPublicConfig = () => ({
  supabaseUrl: config.supabase.url,
  supabaseAnonKey: config.supabase.anonKey,
  turnstileSiteKey: config.turnstile.siteKey,
  appEnv: config.app.nodeEnv,
  baseUrl: config.app.baseUrl,
  isDevelopment: config.app.isDevelopment,
  version: process.env.npm_package_version || '1.0.0',
})

/**
 * Enhanced environment variable validation for Replit secrets
 * Professional error handling with actionable messages
 */
export const validateConfig = () => {
  const requiredVars = [
    { key: 'SUPABASE_URL', description: 'Supabase project URL' },
    { key: 'SUPABASE_ANON_KEY', description: 'Supabase anonymous key' },
    { key: 'TURNSTILE_SITE_KEY', description: 'Cloudflare Turnstile site key' },
    { key: 'TURNSTILE_SECRET_KEY', description: 'Cloudflare Turnstile secret key' },
  ];

  const missing = requiredVars.filter(({ key }) => !process.env[key]);
  
  if (missing.length > 0) {
    const missingList = missing.map(({ key, description }) => `${key} (${description})`).join('\n  - ');
    throw new Error(
      `Missing required environment variables in Replit secrets:\n  - ${missingList}\n\nPlease add these to your Replit project secrets.`
    );
  }

  // Additional validation for proper URL formats
  if (config.supabase.url && !config.supabase.url.startsWith('http')) {
    throw new Error('SUPABASE_URL must be a valid URL starting with http or https');
  }

  return true;
};

/**
 * Safe configuration getter with fallbacks
 * Prevents application crashes from missing environment variables
 */
export const getSafeConfig = () => {
  try {
    validateConfig();
    return { success: true, config, error: null };
  } catch (error) {
    console.error('Configuration validation failed:', error);
    return { 
      success: false, 
      config: null, 
      error: error instanceof Error ? error.message : 'Unknown configuration error' 
    };
  }
};