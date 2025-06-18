# replit.md

## Overview

This is a Next.js 15 admin dashboard application based on shadcn/ui components, featuring a modern and responsive design with Google OAuth authentication via Supabase. The project includes a sophisticated Google Drive file management system that provides intelligent, user-friendly tools for file organization, search, and interaction. The application uses TypeScript, ESLint, Tailwind CSS 4.x, and includes comprehensive UI components for building enterprise-grade admin interfaces with integrated cloud storage capabilities.

## System Architecture

### Frontend Architecture
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript for type safety and better developer experience
- **Styling**: Tailwind CSS 4.x for utility-first styling approach
- **UI Components**: Complete shadcn/ui component library
- **Authentication**: Supabase Auth with Google OAuth integration
- **Security**: Cloudflare Turnstile CAPTCHA protection
- **State Management**: React hooks and context
- **Build Tool**: Next.js native bundling for optimal performance

### Project Structure
- **App Directory**: Uses Next.js 15 App Router with route groups
- **Main Layout**: Dashboard sections under `(main)` route group
- **External Pages**: Authentication and public pages under `(external)` route group
- **Components**: Comprehensive UI library in `/src/components`
- **Configuration**: Centralized app config and utilities

### Development Environment
- **Platform**: Replit cloud environment
- **Package Manager**: npm with modern dependency management
- **Port Configuration**: Application runs on port 3000
- **Theme System**: next-themes with light/dark mode support

## Key Features

### Authentication & Security
- **Google OAuth**: Complete Google sign-in integration via Supabase
- **CAPTCHA Protection**: Cloudflare Turnstile verification before authentication
- **Session Management**: Secure session handling with automatic refresh
- **Protected Routes**: Middleware-based route protection for dashboard access
- **User Profile**: Authenticated user information display with logout functionality

### Dashboard Components
- **Sidebar Navigation**: Collapsible sidebar with route-based navigation including Google Drive section
- **Layout System**: Responsive layout with header, sidebar, and main content areas
- **User Management**: Real-time user authentication status and profile display
- **Google Drive Manager**: Complete file management system with:
  - File and folder browsing with grid view
  - Upload functionality with progress tracking
  - Search and filtering capabilities
  - Unified operations for both files AND folders (rename, move, copy, delete, share, trash, restore)
  - Intelligent folder copying with structure preservation
  - Folder creation and navigation with breadcrumbs
  - Authentication flow integration with Supabase OAuth
  - Comprehensive permission management for all item types
- **UI Components**: Complete shadcn/ui component library including:
  - Data tables with sorting and filtering
  - Forms with validation
  - Modals and dialogs
  - Charts and data visualization
  - Date pickers and input components
  - Navigation menus and breadcrumbs
  - Progress bars and file upload components

### Route Structure
- **Home**: `/` - Landing page with authentication status
- **Main Dashboard**: `/dashboard` - Protected admin interface
- **Google Drive**: `/dashboard/drive` - File management interface
- **Authentication**: `/auth/v1/login` - Google OAuth login
- **Auth Callback**: `/api/auth/callback` - OAuth callback handler
- **Auth Error**: `/auth/auth-code-error` - Authentication error handling
- **Drive API**: `/api/drive/*` - Google Drive operations endpoints
- **External**: Public-facing pages and landing

### Development Tools
- **ESLint**: Comprehensive code quality rules
- **Prettier**: Code formatting with Tailwind CSS plugin
- **Husky**: Git hooks for code quality enforcement
- **TypeScript**: Full type safety across the application

## Data Flow

The application follows a secure Next.js App Router pattern with authentication:
1. **Authentication Flow**: Users sign in via Google OAuth through Supabase
2. **Session Management**: Supabase handles secure session tokens and refresh
3. **Route Protection**: Middleware checks authentication status for protected routes
4. **Real-time Updates**: Client-side auth state synchronization across components
5. **API Integration**: Secure API routes for authentication actions (login, logout, callback)
6. **PostgreSQL Database**: Available for future user data and application state persistence

## External Dependencies

### Runtime Dependencies
- Next.js framework with App Router
- React ecosystem components
- Tailwind CSS for styling
- Supabase client libraries (@supabase/supabase-js, @supabase/ssr)
- Authentication and session management
- Cloudflare Turnstile for CAPTCHA protection

### Development Dependencies
- TypeScript compiler and type definitions
- ESLint for code linting
- Turbopack for build optimization

### Infrastructure Dependencies
- Node.js 20 runtime environment
- Supabase backend service (authentication, database)
- Cloudflare Turnstile service (CAPTCHA verification)
- PostgreSQL 16 database server (available through Supabase)
- Replit hosting platform with environment variable support

## Deployment Strategy

### Development Environment
- Runs on Replit with automated workflows
- Development server starts with `npm run dev`
- Hot reloading enabled through Turbopack
- Port 3000 mapped to external port 80

### Production Considerations
- Next.js supports various deployment targets
- Static generation and server-side rendering capabilities
- Built-in optimization for production builds
- PostgreSQL database ready for production data storage

## User Preferences

Preferred communication style: Simple, everyday language.

## Changelog

- June 16, 2025: Initial Next.js dashboard setup with shadcn/ui components
- June 16, 2025: Implemented Supabase Google OAuth authentication system
- June 16, 2025: Added Cloudflare Turnstile CAPTCHA integration for security
- June 16, 2025: Created protected route middleware and authentication components
- June 16, 2025: Added user profile management and session handling
- June 16, 2025: Completed authentication flow with error handling and logout functionality
- June 16, 2025: Fixed Supabase configuration to use private environment variables only (no NEXT_PUBLIC_ prefix)
- June 16, 2025: Implemented complete Google Drive file management system with API integration
- June 16, 2025: Added Google Drive service layer with file operations (upload, download, search, organize)
- June 16, 2025: Created Drive manager UI with grid view, breadcrumb navigation, and file actions
- June 16, 2025: Integrated Google Drive authentication flow using Supabase OAuth with Drive scopes
- June 17, 2025: Successfully migrated project from Replit Agent to standard Replit environment
- June 17, 2025: Fixed Google Drive access flow with proper scope checking and re-authentication endpoints
- June 17, 2025: Added Drive access verification API to handle Google Drive permissions properly
- June 17, 2025: Fixed critical JavaScript variable naming conflicts in Google Drive Manager
- June 17, 2025: Enhanced Google Drive file operations to support both files and folders (rename, delete, move)
- June 17, 2025: Enhanced environment variable configuration to work with Replit secrets without NEXT_PUBLIC_ prefixes
- June 17, 2025: Implemented balanced professional color scheme for improved cross-platform compatibility
- June 17, 2025: Updated UI components (Button, Input, Card) for better mobile and accessibility support
- June 17, 2025: Enhanced Next.js configuration with security headers and performance optimizations
- June 17, 2025: Added comprehensive CSS improvements for cross-platform text rendering and touch interactions
- June 17, 2025: Implemented professional color palette with proper light/dark mode variants
- June 17, 2025: Enhanced button variants with success/warning states and improved touch feedback
- June 17, 2025: Implemented custom target folder support for move and copy operations
- June 17, 2025: Added URL parsing utility to extract folder IDs from full Google Drive URLs
- June 17, 2025: Created enhanced move and copy dialogs with tabs for folder selection and custom URL input
- June 17, 2025: Enhanced Google Drive service with unified file/folder operations support
- June 17, 2025: Added comprehensive method aliases for clarity (renameFolder, moveFolder, shareFolder, etc.)
- June 17, 2025: Implemented intelligent folder copying with structure preservation
- June 17, 2025: Updated API endpoints to use inclusive terminology (items instead of files only)
- June 17, 2025: Fixed TypeScript type issues in Drive service for better null handling
- June 17, 2025: Fixed UI bug where folders only showed Rename, Share, and Trash options
- June 17, 2025: Added Move and Copy operations to folder dropdown menus (matching file operations)
- June 17, 2025: Updated icon imports and corrected Copy icon for both files and folders
- June 17, 2025: Enhanced error handling for permission-related failures (403 errors)
- June 17, 2025: Added graceful handling for shared files with restricted access
- June 17, 2025: Improved user feedback for operations that fail due to insufficient permissions
- June 17, 2025: Implemented permanent delete functionality with confirmation dialog
- June 17, 2025: Added "Permanently Delete" menu option to both files and folders
- June 17, 2025: Added comprehensive Preview feature for media support with the following capabilities:
  - Image preview with direct display and high-quality rendering
  - Video preview using Google Drive iframe streaming
  - Audio preview with built-in streaming controls via audio proxy
  - Document preview for PDFs and office files using Google Docs Viewer
  - Google Workspace files preview (Docs, Sheets, Slides) with native viewer
  - Created FilePreviewDialog component with responsive design and error handling
  - Added isPreviewable utility function to check file type compatibility
  - Implemented getPreviewUrl utility to generate appropriate preview URLs
  - Created API endpoints for audio proxy (/api/audio-proxy/[fileId]) and direct download (/api/drive/download/[fileId])
  - Added downloadFileStream method to GoogleDriveService for media streaming
  - Integrated Preview option in file dropdown menu with Play icon
  - Enhanced file operations with conditional Preview menu item based on file type
- June 17, 2025: Added comprehensive "Details" feature displaying file/folder metadata, permissions, capabilities, and security information
- June 17, 2025: Created FileDetailsDialog component with professional layout and information sections
- June 17, 2025: Enhanced GoogleDriveService with getFileDetails method for extended metadata retrieval
- June 17, 2025: Added Details menu option to both file and folder dropdown menus
- June 17, 2025: Implemented clipboard copy functionality for file IDs, names, checksums, and links
- June 17, 2025: Added comprehensive error handling for details API endpoint
- June 17, 2025: Enhanced Details feature with complete metadata display including:
  - Image EXIF data (camera settings, GPS coordinates, technical specifications)
  - Video metadata (resolution, duration, aspect ratio)
  - File checksums (MD5, SHA1, SHA256) with copy functionality
  - Complete capabilities matrix showing all permissions
  - Custom file properties and app-specific metadata
  - Content restrictions and security settings
  - Export links for Google Workspace documents
  - Extended system information (drive IDs, spaces, revision data)
  - File status badges (owned, starred, viewed, shared)
  - Original filename and folder color information
- June 17, 2025: Fixed Next.js async parameter warnings for improved compatibility
- June 17, 2025: Implemented comprehensive sections with proper icons and visual hierarchy
- June 17, 2025: Enhanced comprehensive error handling for all menu operations (view, download, rename, move, copy, share, trash, restore, permanent delete)
- June 17, 2025: Added specific error messages for 403 (permission), 404 (not found), and authentication issues
- June 17, 2025: Improved user experience with detailed error descriptions for each operation type
- June 17, 2025: Migrated toast notifications from Radix UI to Sonner for better theming and user experience
- June 17, 2025: Enhanced Sonner component with proper classNames for consistent theme integration
- June 17, 2025: Removed @radix-ui/react-toast dependency to clean up unused packages
- June 17, 2025: Implemented comprehensive Google Drive API optimization for faster loading performance
- June 17, 2025: Added in-memory caching system with TTL for Google Drive API responses (2-5 minute cache)
- June 17, 2025: Reduced default page size from 50 to 20 items for faster initial loading
- June 17, 2025: Implemented pagination with "Load More" functionality for large file collections
- June 17, 2025: Added debounced search (300ms delay) to reduce unnecessary API calls during typing
- June 17, 2025: Created skeleton loading components for better user experience during API calls
- June 17, 2025: Enhanced error handling with proper cache invalidation on authentication errors
- June 17, 2025: Optimized file details API with separate caching for metadata requests
- June 17, 2025: Fixed critical Google Drive upload bug by converting File objects to proper Readable streams
- June 17, 2025: Added Node.js stream import to GoogleDriveService for proper Google APIs client compatibility
- June 17, 2025: Resolved "part.body.pipe is not a function" error in file upload functionality
- June 17, 2025: Disabled upload feature temporarily with "Coming Soon" notification per user request
- June 17, 2025: Modified upload button to show disabled state with toast notification
- June 17, 2025: Enhanced Preview feature with comprehensive full-screen media viewing capabilities:
  - Added fullscreen toggle button for images, videos, and documents
  - Implemented true fullscreen overlay with black background for immersive media experience
  - Added fullscreen toolbar with file info, download, and navigation controls
  - Enhanced image preview with click-to-fullscreen functionality
  - Optimized video and document fullscreen viewing with proper aspect ratios
  - Added keyboard ESC key support to exit fullscreen mode
  - Improved mobile and desktop compatibility with responsive fullscreen controls
  - Added proper z-index layering and body scroll management for fullscreen mode
- June 17, 2025: Fixed React Hooks error in FilePreviewDialog by moving early return after hooks
- June 17, 2025: Implemented comprehensive Share feature for Google Drive files and folders:
  - Created share API endpoint (/api/drive/files/[fileId]/share) for generating share links
  - Added shareFile, shareFolder methods to GoogleDriveService with permission management
  - Implemented automatic clipboard copy functionality for generated share links
  - Added permission creation with configurable roles (reader, writer, commenter) and types (anyone, user, domain)
  - Enhanced error handling for share permission failures and access restrictions
  - Added getFilePermissions and removeFilePermission methods for permission management
  - Integrated share functionality in drive manager with success/error feedback via toast notifications
  - Support for both files and folders with unified sharing approach
- June 17, 2025: Fixed critical file interaction bug causing unintended preview dialog activation:
  - Removed automatic preview trigger from file card clicks that was interfering with dropdown actions
  - Added proper event propagation handling (e.stopPropagation()) to all dropdown menu items
  - Made file names clickable for preview/download functionality with visual hover feedback
  - Fixed Supabase environment variables configuration in share API endpoint
  - Enhanced user experience with intuitive file interaction patterns (click name to preview, use menu for other actions)
- June 17, 2025: Fixed Share functionality bugs by updating authentication token handling in share API endpoint
- June 17, 2025: Implemented comprehensive Table View for Google Drive file management:
  - Added grid/table view toggle using ToggleGroup component with Grid3X3 and List icons
  - Created complete table implementation using shadcn/ui Table components
  - Added responsive table layout with proper column headers (Icon, Name, Size, Modified, Actions)
  - Implemented table view for both files and folders with full functionality
  - Added proper mobile responsiveness hiding size and modified columns on small screens
  - Integrated all file operations (preview, download, rename, move, copy, share, details, trash, delete) in table view
  - Enhanced table rows with hover effects and proper click handling
  - Added file type badges and shared status indicators in table view
  - Maintained consistent UX between grid and table views with identical functionality
  - Improved data presentation with tabular format for better file sorting and organization
- June 17, 2025: Enhanced Table View with customizable column selection feature:
  - Added column selector dropdown with Columns icon next to view toggle buttons
  - Implemented user-configurable column visibility with checkboxes for: Name, ID, Size, Owners, MIME Type, Created Time, Modified Time
  - Created dynamic table headers and cells that show/hide based on user selection
  - Added proper responsive breakpoints for each column type (lg, md, sm, xl)
  - Displayed file/folder IDs in formatted code blocks for easy identification
  - Added owners information showing display names and email addresses
  - Implemented MIME type display with proper formatting for technical users
  - Added created time column alongside modified time for complete timestamp tracking
  - Enhanced user experience with persistent column preferences during session
  - Improved table data density and customization for different user needs and screen sizes
- June 17, 2025: Implemented comprehensive Table Sorting functionality for enhanced data organization:
  - Added interactive sorting support for all major table columns (Name, Size, Modified Time, Created Time, MIME Type)
  - Created clickable table headers with visual sort direction indicators (up/down chevrons)
  - Implemented ascending/descending sort toggle functionality with click-to-sort interaction
  - Added React.useMemo optimization for efficient sorting performance with large file collections
  - Enhanced sorting logic to handle both files and folders with proper data type handling
  - Improved mobile compatibility with better button styling and responsive column headers
  - Added visual feedback with opacity-reduced sort icons for better UX clarity
  - Maintains sort state during session for consistent user experience across interactions
- June 17, 2025: Created comprehensive Code Optimization Guidelines for project maintenance:
  - Established CODE_OPTIMIZATION_GUIDELINES.md with best practices for code reuse
  - Documented strategies to extend existing functions instead of creating new files
  - Added component composition patterns to minimize duplicate components
  - Created guidelines for service layer enhancement and utility function consolidation
  - Defined request templates and code review criteria for consistent development
  - Established anti-patterns to avoid and optimization priorities for different file types
  - Included project-specific examples for Drive Manager context and future reference
- June 17, 2025: Enhanced checkbox sizing and lucide-react icon optimization for cross-platform compatibility:
  - Fixed checkbox sizing inconsistencies across all UI components (Checkbox, DropdownMenu, MenuBar, ContextMenu)
  - Implemented consistent 16px (h-4 w-4) checkbox sizing with proper min/max constraints for cross-platform stability
  - Enhanced checkbox visual feedback with improved border styling, rounded corners, and transitions
  - Optimized lucide-react CheckIcon sizing to 14px (h-3.5 w-3.5) with stroke-[2.5] for better visibility
  - Improved Drive Manager column selector with enhanced spacing, hover effects, and professional styling
  - Added Settings icon to column selector header and enhanced popover layout with better padding
  - Fixed table view checkbox sizing issues by removing forced overrides and using consistent styling
  - Enhanced touch-friendly interactions and accessibility with proper focus states and transitions
  - Implemented professional color scheme with proper hover states for better cross-platform appearance
- June 18, 2025: Implemented comprehensive Performance Monitoring System for free-tier optimization:
  - Created real-time Performance Monitor (performance-monitor.ts) tracking memory, API calls, cache efficiency, and resource scoring
  - Built intelligent Resource Optimizer (resource-optimizer.ts) with automatic optimization strategies based on usage patterns
  - Added Performance Dashboard component with visual monitoring, alerts, and manual optimization triggers
  - Integrated performance tracking into Drive API endpoints with timeout and memory spike detection
  - Enhanced existing cache, request queue, and API optimizer systems with dynamic resource management
  - Implemented conservative thresholds for free-tier compliance (400MB memory limit, 30s API timeout, <250K calls/month)
  - Added performance API endpoints for metrics retrieval, optimization triggers, and data export
  - Created comprehensive monitoring for 1000 concurrent users with automatic resource scaling
  - Documented complete optimization strategy in PERFORMANCE_OPTIMIZATION_REPORT.md
- June 18, 2025: Enhanced Download Operations with stream-based approach for files >10MB:
  - Modified both single and bulk download to use streaming for files >10MB to prevent memory issues
  - Implemented proper streaming download strategy using direct file streams from Google Drive API
  - Updated threshold from 50MB to 10MB for better memory management on free-tier platforms
  - Enhanced download route with stream parameter for memory-efficient large file handling
  - Maintained blob approach only for small files (<10MB) to ensure optimal performance
  - Applied consistent download strategy across single file downloads and bulk operations
  - Improved error handling and user feedback for both small and large file download operations
- **Bulk Operations Implementation** (June 18, 2025):
  - Added comprehensive bulk operations suite with 8 major features
  - Implemented floating action toolbar with context-aware options
  - Added bulk export functionality for Google Workspace files
  - Created pattern-based bulk rename system with preview
  - Integrated bulk restore and permanent delete with security measures
  - Enhanced progress tracking and error handling for all bulk operations