/**
 * Domain configuration utilities
 * Handles different deployment environments and domains
 */

/**
 * Get environment info for debugging
 */
export function getEnvironmentInfo() {
  const isServer = typeof window === 'undefined';
  
  if (isServer) {
    return {
      environment: 'server',
      baseUrl: process.env.BASE_URL,
      nextAuthUrl: process.env.NEXTAUTH_URL,
      nodeEnv: process.env.NODE_ENV,
      
      // Platform detection
      vercelUrl: process.env.VERCEL_URL,
      netlifyUrl: process.env.URL,
      deployPrimeUrl: process.env.DEPLOY_PRIME_URL,
      renderUrl: process.env.RENDER_EXTERNAL_URL,
      railwayDomain: process.env.RAILWAY_PUBLIC_DOMAIN,
      replitDomains: process.env.REPLIT_DOMAINS,
      
      // System
      port: process.env.PORT,
    };
  }
  
  return {
    environment: 'client',
    origin: window.location.origin,
    hostname: window.location.hostname,
    protocol: window.location.protocol
  };
}

/**
 * Validate URL configuration
 */
export function validateUrlConfiguration(): { isValid: boolean; issues: string[]; detected: any } {
  const issues: string[] = [];
  const env = getEnvironmentInfo();
  
  if (env.environment === 'server') {
    // Check if we have any URL source
    const hasAnyUrl = env.baseUrl || env.nextAuthUrl || env.vercelUrl || env.netlifyUrl || 
                      env.renderUrl || env.railwayDomain || env.replitDomains;
    
    if (!hasAnyUrl) {
      issues.push('No BASE_URL or platform URL detected. Set BASE_URL environment variable.');
    }
    
    // Check HTTPS in production
    const detectedUrl = env.baseUrl || env.nextAuthUrl;
    if (detectedUrl && !detectedUrl.startsWith('https://') && env.nodeEnv === 'production') {
      issues.push('BASE_URL should use HTTPS in production');
    }
    
    // Check URL format
    if (detectedUrl) {
      try {
        new URL(detectedUrl);
      } catch (error) {
        issues.push(`Invalid URL format detected: ${detectedUrl}`);
      }
    }
  }
  
  return {
    isValid: issues.length === 0,
    issues,
    detected: env
  };
}