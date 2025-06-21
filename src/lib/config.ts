/**
 * Server-side configuration for environment variables
 * Handles both Replit secrets and traditional environment variables
 */
export const config = {
  google: {
    driveScopes: 'https://www.googleapis.com/auth/drive',
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  },
  nextAuth: {
    secret: process.env.NEXTAUTH_SECRET!,
    url: process.env.NEXTAUTH_URL!,
  },
  app: {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: process.env.PORT || '5000',
    baseUrl: process.env.REPLIT_DOMAINS?.split(',')[0] || 'localhost:5000',
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
    'NEXTAUTH_URL',
  ];

  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
};