# API Documentation

## Authentication Routes

### POST `/api/auth/signin`

- **Description**: Initiate Google OAuth sign-in
- **Method**: POST
- **Response**: Redirect to Google OAuth

### GET `/api/auth/callback/google`

- **Description**: Handle Google OAuth callback
- **Method**: GET
- **Response**: JWT session token

### GET `/api/auth/session`

- **Description**: Get current user session
- **Method**: GET
- **Response**: User session data or null

### POST `/api/auth/signout`

- **Description**: Sign out current user
- **Method**: POST
- **Response**: Success confirmation

## Google Drive API Routes

### GET `/api/drive/files`

- **Description**: Retrieve files from Google Drive
- **Method**: GET
- **Query Parameters**:
  - `sortBy`: 'name' | 'modified' | 'size' | 'created'
  - `sortOrder`: 'asc' | 'desc'
  - `fileType`: 'all' | 'folder' | 'document' | 'image' | 'video' | 'audio'
  - `viewStatus`: 'all' | 'recent' | 'starred' | 'shared' | 'trash'
  - `search`: string (search query)
  - `pageToken`: string (pagination)
  - `pageSize`: number (default: 50)
- **Response**: File list with metadata

### GET `/api/drive/files/[fileId]`

- **Description**: Get specific file details
- **Method**: GET
- **Parameters**: fileId (string)
- **Response**: File metadata and permissions

### POST `/api/drive/files/upload`

- **Description**: Upload file to Google Drive
- **Method**: POST
- **Body**: FormData with file
- **Response**: Uploaded file metadata

### PUT `/api/drive/files/[fileId]/rename`

- **Description**: Rename a file
- **Method**: PUT
- **Parameters**: fileId (string)
- **Body**: `{ name: string }`
- **Response**: Updated file metadata

### DELETE `/api/drive/files/[fileId]`

- **Description**: Delete a file (move to trash)
- **Method**: DELETE
- **Parameters**: fileId (string)
- **Response**: Success confirmation

### POST `/api/drive/files/[fileId]/copy`

- **Description**: Copy a file
- **Method**: POST
- **Parameters**: fileId (string)
- **Body**: `{ name?: string, parentId?: string }`
- **Response**: Copied file metadata

### PUT `/api/drive/files/[fileId]/move`

- **Description**: Move a file to different folder
- **Method**: PUT
- **Parameters**: fileId (string)
- **Body**: `{ parentId: string }`
- **Response**: Updated file metadata

### POST `/api/drive/folders`

- **Description**: Create new folder
- **Method**: POST
- **Body**: `{ name: string, parentId?: string }`
- **Response**: Created folder metadata

## Health Check Routes

### GET `/api/health`

- **Description**: Application health status
- **Method**: GET
- **Response**: System status

### GET `/api/health/db`

- **Description**: Database connectivity check
- **Method**: GET
- **Response**: Database status

### GET `/api/health/drive`

- **Description**: Google Drive API status
- **Method**: GET
- **Response**: Drive API connectivity status

## Development & Cache Management Routes

### POST `/api/cache/clear`

- **Description**: Clear application cache (development/testing endpoint)
- **Method**: POST
- **Purpose**: Fixes pageSize filter issues during development when cached results interfere with new requests
- **Usage**: When pageSize returns cached results instead of requested amount
- **Authentication**: Required (protected route)
- **Response**: 
```json
{
  "success": true, 
  "message": "Cache cleared successfully"
}
```
- **Use Cases**:
  - PageSize filter returning wrong item count due to cache
  - Development testing with different filter parameters
  - Debugging cache-related issues

## Response Formats

### Success Response

```json
{
  "success": true,
  "data": {},
  "message": "Operation completed successfully"
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": {}
  }
}
```

## Authentication

All protected routes require valid JWT session token. The application uses NextAuth.js for session management with Google OAuth 2.0.

**Required Scopes:**

- `https://www.googleapis.com/auth/drive`
- `https://www.googleapis.com/auth/userinfo.email`
- `https://www.googleapis.com/auth/userinfo.profile`
- `openid`

## Project Status

- All 76 tests passing
- TypeScript compilation successful
- No NEXT*PUBLIC* environment variables
- Simple file naming convention followed
- Database: 4 tables (PostgreSQL)
- Authentication: Google OAuth 2.0 with NextAuth.js

Last Updated: June 24, 2025
