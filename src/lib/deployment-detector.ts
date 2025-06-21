/**
 * Deployment Platform Detection Utility
 * Auto-detects which platform the app is deployed on
 */

export type DeploymentPlatform = 
  | 'vercel' 
  | 'netlify' 
  | 'render' 
  | 'railway' 
  | 'replit' 
  | 'localhost' 
  | 'custom'
  | 'unknown';

export interface PlatformInfo {
  platform: DeploymentPlatform;
  detectedUrl?: string;
  environmentVars: Record<string, string | undefined>;
}

/**
 * Detect the current deployment platform
 */
export function detectDeploymentPlatform(): PlatformInfo {
  const env = process.env;
  
  // Vercel
  if (env.VERCEL_URL || env.VERCEL) {
    return {
      platform: 'vercel',
      detectedUrl: env.VERCEL_URL ? `https://${env.VERCEL_URL}` : undefined,
      environmentVars: {
        VERCEL_URL: env.VERCEL_URL,
        VERCEL_ENV: env.VERCEL_ENV,
        VERCEL_REGION: env.VERCEL_REGION,
      }
    };
  }
  
  // Netlify
  if (env.NETLIFY || env.DEPLOY_PRIME_URL || env.URL) {
    return {
      platform: 'netlify',
      detectedUrl: env.DEPLOY_PRIME_URL || env.URL,
      environmentVars: {
        URL: env.URL,
        DEPLOY_PRIME_URL: env.DEPLOY_PRIME_URL,
        NETLIFY_SITE_ID: env.NETLIFY_SITE_ID,
      }
    };
  }
  
  // Render
  if (env.RENDER || env.RENDER_EXTERNAL_URL) {
    return {
      platform: 'render',
      detectedUrl: env.RENDER_EXTERNAL_URL,
      environmentVars: {
        RENDER_EXTERNAL_URL: env.RENDER_EXTERNAL_URL,
        RENDER_SERVICE_ID: env.RENDER_SERVICE_ID,
      }
    };
  }
  
  // Railway
  if (env.RAILWAY_PUBLIC_DOMAIN || env.RAILWAY_ENVIRONMENT_NAME) {
    return {
      platform: 'railway',
      detectedUrl: env.RAILWAY_PUBLIC_DOMAIN ? `https://${env.RAILWAY_PUBLIC_DOMAIN}` : undefined,
      environmentVars: {
        RAILWAY_PUBLIC_DOMAIN: env.RAILWAY_PUBLIC_DOMAIN,
        RAILWAY_ENVIRONMENT_NAME: env.RAILWAY_ENVIRONMENT_NAME,
      }
    };
  }
  
  // Replit
  if (env.REPLIT_DOMAINS || env.REPL_ID) {
    return {
      platform: 'replit',
      detectedUrl: env.REPLIT_DOMAINS ? `https://${env.REPLIT_DOMAINS.split(',')[0]}` : undefined,
      environmentVars: {
        REPLIT_DOMAINS: env.REPLIT_DOMAINS,
        REPL_ID: env.REPL_ID,
        REPL_SLUG: env.REPL_SLUG,
      }
    };
  }
  
  // Custom domain (BASE_URL set)
  if (env.BASE_URL) {
    return {
      platform: 'custom',
      detectedUrl: env.BASE_URL,
      environmentVars: {
        BASE_URL: env.BASE_URL,
      }
    };
  }
  
  // Localhost
  if (env.NODE_ENV === 'development' || !env.NODE_ENV) {
    const port = env.PORT || '5000';
    return {
      platform: 'localhost',
      detectedUrl: `http://localhost:${port}`,
      environmentVars: {
        PORT: env.PORT,
        NODE_ENV: env.NODE_ENV,
      }
    };
  }
  
  return {
    platform: 'unknown',
    environmentVars: {}
  };
}

/**
 * Get recommended environment variables for current platform
 */
export function getRecommendedEnvVars(): string[] {
  const platform = detectDeploymentPlatform();
  
  const baseVars = [
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET', 
    'NEXTAUTH_SECRET',
    'DATABASE_URL'
  ];
  
  switch (platform.platform) {
    case 'custom':
      return [...baseVars, 'BASE_URL'];
    case 'localhost':
      return [...baseVars, 'NEXTAUTH_URL'];
    default:
      return [...baseVars, 'BASE_URL (optional - will auto-detect)'];
  }
}