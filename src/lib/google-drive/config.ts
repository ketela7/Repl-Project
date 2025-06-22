import { google } from 'googleapis';

export function createDriveClient(accessToken: string) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  
  return google.drive({ 
    version: 'v3', 
    auth,
    timeout: 15000, // 15 second timeout
    retry: true,
    retryConfig: {
      retry: 3,
      retryDelay: 1000,
      statusCodesToRetry: [[100, 199], [429, 429], [500, 599]]
    }
  });
}