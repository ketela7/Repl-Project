/**
 * Auto-detect base URL from various deployment platforms
 */
function detectBaseUrl(): string {
  // Priority 1: Manual BASE_URL override
  if (process.env.BASE_URL) {
    return process.env.BASE_URL;
  }
  
  // Priority 2: Extract from NEXTAUTH_URL
  if (process.env.NEXTAUTH_URL) {
    try {
      const url = new URL(process.env.NEXTAUTH_URL);
      return url.origin;
    } catch (error) {
      console.warn('Invalid NEXTAUTH_URL format:', process.env.NEXTAUTH_URL);
    }
  }
  
  // Priority 3: Platform-specific auto-detection
  // Vercel
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  
  // Netlify
  if (process.env.DEPLOY_PRIME_URL) {
    return process.env.DEPLOY_PRIME_URL;
  }
  if (process.env.URL) {
    return process.env.URL;
  }
  
  // Render
  if (process.env.RENDER_EXTERNAL_URL) {
    return process.env.RENDER_EXTERNAL_URL;
  }
  
  // Railway
  if (process.env.RAILWAY_PUBLIC_DOMAIN) {
    return `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`;
  }
  
  // Replit
  if (process.env.REPLIT_DOMAINS) {
    const domain = process.env.REPLIT_DOMAINS.split(',')[0];
    return `https://${domain}`;
  }
  
  // Development fallback
  const port = process.env.PORT || '5000';
  return `http://localhost:${port}`;
}

/**
 * Server-side configuration for environment variables
 * Uses BASE_URL as the core environment variable for all URL routing
 */
export const config = {
  google: {
    driveScopes: 'https://www.googleapis.com/auth/drive',
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  },
  nextAuth: {
    secret: process.env.NEXTAUTH_SECRET!,
    url: process.env.NEXTAUTH_URL || `${detectBaseUrl()}/api/auth`,
  },
  app: {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: process.env.PORT || '5000',
    baseUrl: detectBaseUrl(),
  },
}

/**
 * Public configuration for client-side components
 * These values are safe to expose to the browser
 */
export const getPublicConfig = () => ({
  appEnv: config.app.nodeEnv,
  baseUrl: config.app.baseUrl,
})

/**
 * Validates required environment variables
 */
export const validateConfig = () => {
  const requiredVars = [
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'NEXTAUTH_SECRET',
    // NEXTAUTH_URL is now optional - will be auto-generated from BASE_URL
  ];

  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  // Validate URL configuration
  const baseUrl = config.app.baseUrl;
  if (!baseUrl || (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://'))) {
    throw new Error(`Invalid BASE_URL detected: ${baseUrl}. Must be a valid HTTP/HTTPS URL.`);
  }
  
  console.log(`✓ BASE_URL detected: ${baseUrl}`);
  console.log(`✓ NEXTAUTH_URL configured: ${config.nextAuth.url}`);
  
  // Debug environment variables
  console.log('Environment check:');
  console.log('- BASE_URL:', process.env.BASE_URL);
  console.log('- NEXTAUTH_URL:', process.env.NEXTAUTH_URL);
  console.log('- NODE_ENV:', process.env.NODE_ENV);
  console.log('- REPLIT_DOMAINS:', process.env.REPLIT_DOMAINS);
};