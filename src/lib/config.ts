/**
 * Serverside configuration for environment variables
 * Handles both Replit secrets and traditional environment variables
 */
export const config = {
  google: {
    driveScopes: 'https://www.googleapis.com/auth/drive',
    clientId: process.env.GOOGLECLIENT_ID!,
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

// Unused config functions removed
