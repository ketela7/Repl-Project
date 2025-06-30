# Google Drive Pro - Professional Drive Management Application

## Overview

Google Drive Pro is a professional-grade Google Drive management application built with Next.js 14 using the App Router. It provides enterprise-level file operations, intuitive user interactions, and advanced Google Drive API integration for efficient document management. The application features comprehensive file operations, bulk actions, advanced search, and mobile-optimized interfaces.

## System Architecture

### Frontend Architecture
- **Framework**: Next.js 14 with App Router for modern React development
- **Styling**: Tailwind CSS with shadcn/ui component library for consistent design
- **UI Components**: Radix UI primitives for accessible, customizable components
- **State Management**: React hooks with optimized caching strategies
- **Performance**: Code splitting, lazy loading, and bundle optimization for fast loading

### Backend Architecture
- **API Routes**: Next.js App Router API routes with static routing structure
- **Authentication**: NextAuth.js with Google OAuth provider for secure authentication
- **Google Drive Integration**: Direct Google Drive API v3 integration with proper token management
- **Error Handling**: Comprehensive error boundary system with retry mechanisms

### Key Design Decisions
- **Static API Routing**: Migrated from dynamic routing `/api/drive/files/[fileId]/operation` to static routing `/api/drive/files/operation` for better performance and caching
- **Server-side Environment Variables**: All sensitive configuration handled server-side only (no NEXT_PUBLIC_ variables)
- **TypeScript Strict Mode**: Type safety throughout the application with comprehensive interface definitions
- **Mobile-first Design**: Responsive design with touch-optimized interactions for mobile devices

## Key Components

### Core Components
- **DriveManager**: Main file management interface with advanced operations
- **DriveDataView**: Optimized data table with sorting, filtering, and bulk operations
- **DriveToolbar**: Floating action toolbar with context-sensitive operations
- **FileIcon**: Dynamic file type icons with mime-type detection
- **ErrorBoundary**: Comprehensive error handling with user-friendly fallbacks

### Dialog Components (Lazy Loaded)
- **OperationsDialog**: Centralized operations management
- **ItemsMoveDialog**: File/folder moving operations
- **ItemsCopyDialog**: File/folder copying operations
- **ItemsDeleteDialog**: Permanent deletion confirmation
- **ItemsTrashDialog**: Move to trash operations
- **ItemsShareDialog**: File sharing and permissions
- **ItemsRenameDialog**: Bulk renaming operations
- **ItemsExportDialog**: File export in various formats

### Provider Components
- **AuthProvider**: NextAuth.js session management
- **ThemeProvider**: Dark/light theme switching
- **TimezoneProvider**: Automatic timezone detection and formatting

## Data Flow

### Authentication Flow
1. User initiates Google OAuth login through NextAuth.js
2. Google returns access and refresh tokens
3. Tokens stored in JWT session for API access
4. Session automatically refreshed using refresh tokens

### File Operations Flow
1. User selects files/folders in the interface
2. Operations trigger API calls to `/api/drive/files/{operation}`
3. Google Drive Service handles API communication with error handling
4. Results cached and UI updated with optimistic updates
5. Toast notifications provide user feedback

### API Request Flow
- **Request Throttling**: 25 requests/second limit to prevent rate limiting
- **Request Deduplication**: Prevents duplicate identical API calls
- **Caching**: 10-minute TTL for file listings and metadata
- **Error Handling**: Automatic retry with exponential backoff

## External Dependencies

### Core Dependencies
- **Next.js**: Web framework with App Router
- **NextAuth.js**: Authentication provider integration
- **Google APIs**: Direct integration with Google Drive API v3
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: Component library built on Radix UI

### UI Libraries
- **Radix UI**: Headless UI primitives for accessibility
- **Lucide React**: Modern icon library
- **Sonner**: Toast notification system
- **TanStack Table**: Advanced data table functionality

### Development Tools
- **TypeScript**: Type safety and developer experience
- **ESLint**: Code linting and formatting
- **Jest**: Testing framework with React Testing Library
- **Prettier**: Code formatting

## Deployment Strategy

### Environment Configuration
- **Replit Deployment**: Optimized for Replit hosting environment
- **Environment Variables**: Server-side secrets management
- **Performance Optimization**: Bundle splitting and lazy loading
- **Security**: CSP headers, HSTS, and XSS protection

### Build Optimization
- **TypeScript Compilation**: Fast incremental builds
- **Bundle Analysis**: Optimized package imports and tree shaking
- **Caching Strategy**: Aggressive caching for static assets
- **Mobile Optimization**: Touch-friendly interfaces and reduced bundle size

### Monitoring and Error Handling
- **Error Boundaries**: React error boundaries for graceful degradation
- **API Monitoring**: Request success/failure tracking
- **Performance Metrics**: Bundle size and loading time optimization
- **User Feedback**: Comprehensive toast notification system

## Changelog

```
Changelog:
- June 28, 2025. Initial setup
- June 28, 2025. Fixed operation dialog UI layout issues with many files - improved Copy/Move/Trash/Untrash dialogs with compact design, scrollable previews, and better text truncation
- June 28, 2025. Enhanced DriveDestinationSelector with mobile-friendly compact layout
- June 28, 2025. Enhanced all operation dialogs with comprehensive user feedback - added loading states, success/error messages, and partial completion warnings for Move, Copy, Trash, Share, Rename, Export, Delete, Restore, and Download operations
- June 28, 2025. Updated download operations to use direct browser downloads instead of blob mechanism - simplified download process for better browser compatibility and reduced memory usage
- June 28, 2025. Updated operation button labels and function names for consistency - "Restore from Trash" → "Untrash", "Permanent Delete" → "Delete", updated corresponding function names
- June 29, 2025. Implemented direct streaming downloads with _blank opening - extended existing download route to stream files directly from Google Drive API without using Google Drive download URLs, follows "extend over create" principle
- June 29, 2025. Fixed driveService API access pattern - corrected all API calls to use driveService.drive.files instead of driveService.files for proper Google Drive API integration
- June 29, 2025. Fixed download empty tab issue - implemented direct window.open() calls with full domain URLs instead of relative paths, simplified download system with proper Node.js to Web Stream conversion for browser compatibility
- June 29, 2025. Completed ItemsRenameDialog alignment with ItemsDownloadDialog pattern - restructured with init-process-end flow in renderContent, implemented identical loading states and progress tracking, updated handleRenameComplete to match handleDownloadComplete pattern, added comprehensive error handling and cancellation support
- June 29, 2025. Enhanced error handling system with detailed user-friendly messages - replaced "Unknown error" with specific error descriptions and actionable suggestions, added filename validation, improved Google Drive API error mapping, implemented helpful error suggestions for authentication, permissions, filename issues, and network problems
- June 29, 2025. Fixed Move operation folder validation - created dedicated `/api/drive/folders/validate` endpoint with improved error handling for access denied scenarios, updated DriveDestinationSelector to use new validation system, resolved "Folder not found or access denied" issues when pasting valid folder URLs/IDs
- June 29, 2025. Completed naming consistency improvements - updated all "Restore from Trash" references to "Untrash Items", "Permanent Delete" to "Delete Permanently", and "can be restored" to "can be untrashed" throughout the application for clearer user understanding
- June 29, 2025. Fixed Operations dialog declaration consistency - removed all "Bulk" references from dialog descriptions, updated button labels to be generic (Move, Copy, Share, etc.), changed descriptions to show actual item counts for both single and multiple selections, unified all dialogs to handle operations as arrays regardless of selection size
- June 29, 2025. Fixed Copy/Move folder selection workflow - reverted automatic tab switching behavior, URL/ID selection now works like Browse Folder button to show folder contents immediately after selection
- June 29, 2025. Enhanced Copy/Move progress display - "Confirm Destination" button now triggers operation immediately and shows progress, changed button text to "Confirm & Move/Copy" for clarity, eliminated extra step of returning to main dialog before starting operation
- June 29, 2025. Added comprehensive completion results display - operations now show complete results summary with success/failed/skipped counts, error details, and "Close & Refresh" button that automatically refreshes the page to display updated file listings
- June 29, 2025. Completed all 9 operations with standardized init-process-end flow - Share, Export, Trash, Delete, and Untrash operations now follow identical pattern to Download/Rename/Move/Copy with comprehensive progress tracking, cancellation support, and completion results display
- June 29, 2025. Fixed share operation API validation and request handling - updated validation logic to accept items array format, properly handled accessLevel and linkAccess parameters, added share link generation in API responses
- June 29, 2025. Added comprehensive export functionality to share operation - users can now export successful share links in multiple formats (CSV, TXT, JSON) with structured data, automatic file naming with dates, and proper error handling. CSV format uses "name,sharelink" structure, TXT uses "name: sharelink" format, and JSON includes metadata with export date and file IDs
- June 29, 2025. Fixed inconsistent "skipped" logic across all operations - replaced misleading skipped counters with accurate "processed" counters, removed non-functional skipped logic where items are either successful or failed, implemented proper progress tracking that shows meaningful statistics during operations
- June 29, 2025. Fixed critical grid view event propagation bug where dropdown menu clicks triggered card onClick events causing both preview and details dialogs to open simultaneously - added stopPropagation wrapper around dropdown menu container
- June 29, 2025. Added comprehensive copy functionality to table data view - all cells (name, size, MIME type, modified time, created time, owners) now have copy icons that appear on hover with proper toast notifications and event handling to prevent row selection conflicts
- June 30, 2025. Major code optimization of drive-data-view.tsx - created reusable CopyableCell component to eliminate 150+ lines of duplicate code across table cells, added memoized handlers and table headers for better performance, implemented proper component composition following React best practices
- June 30, 2025. Media preview optimization - removed isPreviewable function and simplified preview logic to use getPreviewUrl directly, improved renderPreviewContent with perfect iframe sizing that matches preview container, removed file description for clean appearance, implemented minimal floating controls with only fullscreen/miniscreen and close buttons
- June 30, 2025. Refactored toast utilities architecture - moved src/lib/toast.ts to src/components/ui/toast.tsx for better organization following UI component structure, updated all import references, maintained consistent toast functionality while improving project structure alignment
- June 30, 2025. Major code cleanup - removed dead code files including unused optimization utilities (loading-optimization.tsx, search-optimizer.ts, use-progressive-file-details.ts, bundle-optimizer.ts, check-drive-access API), unused components (additional-icons.tsx, drag-column.tsx, drive-error-boundary.tsx, file-category-badges.tsx), and unused utilities (actions.ts, api-performance.ts), cleaned up lazy imports removing DataTable and ChartComponents, improved codebase maintainability
- June 30, 2025. Production readiness optimization - enabled React Strict Mode, configured production security headers (X-Frame-Options, X-Content-Type-Options, Referrer-Policy), optimized webpack chunk splitting for UI components, enabled production source maps for debugging, created comprehensive production readiness script and deployment guide
- June 30, 2025. Removed unused API endpoints - deleted /api/drive/files/essential and /api/drive/files/extended endpoints that were only used in testing scripts, updated test script to remove references to deleted endpoints, improved codebase cleanliness for production
- June 30, 2025. Fixed all TypeScript and ESLint errors for production - resolved 195+ TypeScript exactOptionalPropertyTypes errors, fixed import syntax issues, corrected capabilities type assignments, applied comprehensive error fixing across 24 files, achieved zero compilation errors for production deployment
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```