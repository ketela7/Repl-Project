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
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    driveScopes: 'https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/drive.file',
    redirectUri: process.env.GOOGLE_REDIRECT_URI || `${getBaseUrl()}/api/auth/google/callback`,
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
  googleClientId: config.google.clientId,
  appEnv: config.app.nodeEnv,
  baseUrl: config.app.baseUrl,
  isDevelopment: config.app.isDevelopment,
  version: process.env.npm_package_version || '1.0.0',
})

/**
 * Validates required environment variables
 */
export const validateConfig = () => {
  const requiredVars = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY', 
    'TURNSTILE_SITE_KEY',
    'TURNSTILE_SECRET_KEY',
  ];

  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
};