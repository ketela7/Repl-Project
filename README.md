# Professional Google Drive Management

A professional web application for managing Google Drive files and folders with enhanced cross-platform compatibility and enterprise UI design. Built with Next.js 15, TypeScript, and optimized for all device types with a balanced professional color scheme.

## Features

### File Operations
- **Upload Files**: Drag-and-drop or browse to upload files to Google Drive
- **Create Folders**: Create new folders with intuitive naming
- **View Files**: Preview files directly in Google Drive's web viewer
- **Preview Media**: Enhanced preview functionality for media files with support for:
  - **Images**: Direct display with zoom and high-quality rendering
  - **Videos**: Embedded video player with streaming support
  - **Audio**: Built-in audio player with streaming controls
  - **Documents**: Inline document viewer for PDFs and office files
  - **Google Workspace**: Native preview for Docs, Sheets, Slides
- **Download Files**: Direct download links for supported file types
- **Rename Files/Folders**: Interactive rename dialog with smart text selection
- **Move Files/Folders**: Move items between folders with folder selection dialog
- **Copy Files**: Duplicate files with automatic naming
- **Delete Operations**: 
  - **Move to Trash**: Standard trash operation for files and folders
  - **Permanently Delete**: Available for both normal and trash views with enhanced security
  - Smart menu display based on file permissions and current view
- **Restore Files**: Restore files from trash
- **Details View**: Comprehensive information display including:
  - Basic file information (name, type, size, ID, version)
  - Creation and modification history with user details
  - Ownership and sharing permissions
  - Security checksums (MD5, SHA1, SHA256)
  - Image EXIF metadata (camera settings, GPS location, technical specs)
  - Video metadata (resolution, duration, aspect ratio)
  - File capabilities and restrictions
  - Custom properties and app-specific data

### Bulk Operations (Phase 1 Enhanced)
- **Bulk Selection**: Multi-select mode with floating action toolbar
- **Intelligent Processing**: Automatic parallel processing for safe operations (download, copy, share)
- **Operation Preview**: Shows exactly what will happen before execution:
  - Number of items to process vs skip
  - Estimated completion time
  - Detailed skip reasons grouped by type
- **Bulk Download**: Download multiple files with parallel processing:
  - Batch processing up to 5 files simultaneously
  - Folders automatically skipped (only individual files supported)
  - Google Workspace files skipped with export suggestion
  - Real-time progress with time remaining estimates
- **Bulk Export**: Export Google Workspace files (Docs, Sheets, Slides) to various formats:
  - PDF, DOCX, XLSX, PPTX, ODT, ODS, PNG, JPEG
  - Smart format filtering based on file types
  - Automatic download of exported files
- **Bulk Rename**: Rename multiple items using consistent patterns:
  - Add prefix or suffix to existing names
  - Sequential numbering with custom base names
  - Timestamp addition for organization
  - Live preview of rename results
- **Bulk Move**: Move multiple files and folders to new locations
- **Bulk Copy**: Copy multiple files with parallel processing (folders skipped due to API limitations)
- **Bulk Delete**: Move multiple items to trash with confirmation
- **Bulk Restore**: Restore multiple items from trash to original locations
- **Bulk Permanent Delete**: Permanently delete items with enhanced security confirmation
- **Retry Functionality**: Failed operations can be retried with just the failed items
- **Enhanced Error Handling**: 
  - Pre-filtering to prevent unnecessary API calls
  - Smart skip logic with detailed reasons for each unsupported operation
  - Grouped error messages for better user understanding
  - Individual item tracking with success/failure status
  - Database logging for all operations with audit trail
- **Performance Metrics**: Completion reports include total time and average per item
  - Export links for Google Workspace files
  - Extended metadata (drive IDs, spaces, content restrictions)

### Navigation & Organization
- **Breadcrumb Navigation**: Visual path navigation with clickable elements
- **Folder Browsing**: Click to navigate through folder hierarchy
- **Search Functionality**: Search across all files and folders
- **Real-time Refresh**: Manual and automatic content updates

### User Interface
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Dark/Light Mode**: Theme switching support with next-themes
- **Loading States**: Progress indicators for all operations
- **Error Handling**: Comprehensive error messages with actionable feedback
- **Toast Notifications**: Real-time success and error notifications
- **Performance Dashboard**: Real-time monitoring with 4 tabs (Overview, Performance, Usage Stats, Error Tracking)

### Performance Monitoring
- **Real-time Metrics**: Memory usage, API performance, cache efficiency
- **Resource Optimization**: Automatic optimization for 1000+ concurrent users
- **Alert System**: Proactive alerts for high latency (>5s), memory usage (>400MB)
- **Free-tier Optimized**: Designed for Replit deployment with resource constraints

### Authentication & Security
- **Google OAuth Integration**: Secure authentication with Google accounts
- **Token Management**: Automatic token refresh and validation
- **Scope Verification**: Ensures proper Google Drive permissions
- **Session Management**: Persistent authentication across browser sessions

## Technology Stack

### Frontend
- **Next.js 15**: React framework with App Router
- **TypeScript**: Type-safe development with strict mode
- **Tailwind CSS**: Utility-first CSS framework
- **Shadcn/ui**: Built on Radix UI primitives
- **Lucide React**: Modern icon library
- **Sonner**: Toast notification system
- **next-themes**: Dark/light mode support

### Backend
- **Next.js API Routes**: Server-side API endpoints
- **Google APIs**: Official Google Drive API integration
- **Supabase**: Authentication and session management
- **Drizzle ORM**: Type-safe database operations with PostgreSQL
- **Cloudflare Turnstile**: CAPTCHA protection

### Performance & Optimization
- **Performance Monitor**: Real-time resource tracking
- **Resource Optimizer**: Intelligent optimization for free-tier deployment
- **Cache System**: Multi-layer caching with TTL management
- **Request Queue**: Concurrent request management
- **API Optimizer**: Batch processing and rate limiting

### Development Tools
- **ESLint**: Code quality and consistency
- **Prettier**: Code formatting
- **Husky**: Git hooks for quality checks
- **TypeScript ESLint**: Advanced TypeScript linting

## Project Structure

```
src/
├── app/
│   ├── (main)/dashboard/drive/          # Drive manager pages
│   │   ├── _components/                 # Drive-specific components
│   │   │   ├── drive-manager.tsx        # Main drive interface
│   │   │   ├── file-upload-dialog.tsx   # Upload functionality
│   │   │   ├── create-folder-dialog.tsx # Folder creation
│   │   │   ├── file-rename-dialog.tsx   # Rename interface
│   │   │   ├── file-move-dialog.tsx     # Move files dialog
│   │   │   └── drive-connection-card.tsx # Auth connection
│   │   └── page.tsx                     # Drive page entry
│   ├── api/                             # Backend API routes
│   │   ├── auth/                        # Authentication endpoints
│   │   └── drive/                       # Google Drive API endpoints
│   └── layout.tsx                       # Root layout
├── components/
│   ├── ui/                              # Reusable UI components
│   └── providers/                       # Context providers
├── lib/
│   ├── google-drive/                    # Google Drive integration
│   │   ├── service.ts                   # Main service class
│   │   ├── types.ts                     # TypeScript definitions
│   │   ├── utils.ts                     # Utility functions
│   │   └── config.ts                    # API configuration
│   ├── supabase/                        # Supabase integration
│   └── utils.ts                         # General utilities
└── middleware.ts                        # Request middleware
```

## API Endpoints

### Authentication
- `GET /api/auth/google-drive` - Initiate Google OAuth flow
- `GET /api/auth/check-drive-access` - Verify Drive permissions

### File Operations
- `GET /api/drive/files` - List files and folders
- `POST /api/drive/files` - Upload new files
- `GET /api/drive/files/[fileId]` - Get file details
- `PUT /api/drive/files/[fileId]` - Update file (rename, move, trash, restore)
- `DELETE /api/drive/files/[fileId]` - Permanently delete file
- `POST /api/drive/files/[fileId]/copy` - Copy file

### Folder Operations
- `GET /api/drive/folders` - List folders
- `POST /api/drive/folders` - Create new folder

## Error Handling

The application implements comprehensive error handling:

### Client-Side Errors
- **Network Issues**: Automatic retry mechanisms
- **Authentication Failures**: Redirect to login flow
- **Permission Errors**: Clear instructions for resolution
- **Validation Errors**: Inline form validation

### Server-Side Errors
- **Google API Errors**: Detailed error mapping and user-friendly messages
- **Token Expiration**: Automatic refresh or re-authentication prompts
- **Rate Limiting**: Graceful degradation with retry logic
- **Server Failures**: Fallback error pages with retry options

## Performance Optimizations

### Frontend
- **Code Splitting**: Automatic route-based splitting
- **Image Optimization**: Next.js built-in optimization
- **Caching**: Strategic caching of API responses
- **Lazy Loading**: Component and route lazy loading

### Backend
- **API Optimization**: Efficient Google Drive API usage
- **Database Queries**: Optimized Drizzle ORM queries
- **Response Compression**: Automatic compression for API responses
- **Error Boundaries**: Prevent cascading failures

## Security Features

### Data Protection
- **HTTPS Enforcement**: All communications encrypted
- **Token Security**: Secure storage and transmission
- **CSRF Protection**: Built-in Next.js protection
- **Input Validation**: Comprehensive input sanitization

### Access Control
- **OAuth Scopes**: Minimal required permissions
- **Session Validation**: Server-side session verification
- **API Rate Limiting**: Protection against abuse
- **Error Information**: Limited error details in production

## Browser Compatibility

### Supported Browsers
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Mobile Support
- iOS Safari 14+
- Android Chrome 90+
- Progressive Web App capabilities

## Contributing

### Development Setup
1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables
4. Run development server: `npm run dev`

### Code Standards
- TypeScript for type safety
- ESLint for code quality
- Prettier for formatting
- Conventional commits for git history

### Testing
- Unit tests with Jest
- Integration tests for API endpoints
- End-to-end tests with Playwright
- Component testing with React Testing Library

## Deployment

### Production Deployment
- **Platform**: Optimized for Vercel deployment
- **Build Process**: Next.js production build
- **Environment Variables**: Secure configuration management
- **Monitoring**: Error tracking and performance monitoring

### Environment Configuration
Required environment variables (stored in Replit secrets):
- `DATABASE_URL` - PostgreSQL database connection string
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (optional)
- `TURNSTILE_SITE_KEY` - Cloudflare Turnstile site key
- `TURNSTILE_SECRET_KEY` - Cloudflare Turnstile secret key

Note: Environment variables are handled without NEXT_PUBLIC_ prefixes for better security. Configuration is managed through server-side rendering and passed to client components securely.

## License

This project is built for educational and demonstration purposes. Please ensure compliance with Google Drive API terms of service and applicable data protection regulations.

## Support

For technical support or questions about implementation, please refer to the comprehensive error handling and logging systems built into the application.