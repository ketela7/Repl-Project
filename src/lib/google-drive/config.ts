import { google } from 'googleapis'

export function createDriveClient(accessToken: string) {
  if (!accessToken) {
    throw new Error('Access token is required for Google Drive API')
  }

  const auth = new google.auth.OAuth2()
  auth.setCredentials({
    access_token: accessToken.trim(),
    token_type: 'Bearer',
  })

  return google.drive({
    version: 'v3',
    auth,
    timeout: 30000, // 30 second timeout
    retry: true,
    retryConfig: {
      retry: 3,
      retryDelay: 1000,
      statusCodesToRetry: [
        [100, 199],
        [429, 429],
        [500, 599],
      ],
    },
  })
}
