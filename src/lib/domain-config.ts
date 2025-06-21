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
      nextAuthUrl: process.env.NEXTAUTH_URL,
      nodeEnv: process.env.NODE_ENV,
      vercelUrl: process.env.VERCEL_URL,
      replitDomains: process.env.REPLIT_DOMAINS
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
export function validateUrlConfiguration(): { isValid: boolean; issues: string[] } {
  const issues: string[] = [];
  const env = getEnvironmentInfo();
  
  if (env.environment === 'server') {
    if (!env.nextAuthUrl) {
      issues.push('NEXTAUTH_URL environment variable is not set');
    }
    
    if (env.nextAuthUrl && !env.nextAuthUrl.startsWith('https://') && env.nodeEnv === 'production') {
      issues.push('NEXTAUTH_URL should use HTTPS in production');
    }
  }
  
  return {
    isValid: issues.length === 0,
    issues
  };
}