# Routes Documentation

## Application Routes

### Authentication Routes
- `/` - Landing page with login
- `/auth/v1/login` - Google OAuth login page
- `/auth/v1/register` - User registration (if enabled)

### Dashboard Routes
- `/dashboard` - Main dashboard redirect
- `/dashboard/drive` - Google Drive file management interface

### API Routes (Server-side)
- `/api/auth/[...nextauth]` - NextAuth.js authentication handlers
- `/api/auth/session` - Get current session
- `/api/drive/files` - Drive file operations
- `/api/drive/folders` - Drive folder operations
- `/api/health` - Application health check
- `/api/health/db` - Database health check
- `/api/health/drive` - Google Drive API health check

## Route Protection

### Public Routes
- `/` (Landing page)
- `/auth/v1/login`
- `/auth/v1/register`
- `/api/auth/*` (Authentication endpoints)
- `/api/health*` (Health checks)

### Protected Routes
- `/dashboard/*` - Requires valid session
- `/api/drive/*` - Requires valid Google Drive authentication

## Middleware
- Authentication middleware protects all `/dashboard/*` routes
- Automatic token refresh for expired sessions
- Redirect to login for unauthenticated users

Last Updated: June 24, 2025