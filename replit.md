# Professional Google Drive Management Application

## Overview

This is a Next.js-based professional Google Drive management application that provides enterprise-grade file operations and intuitive user interactions. The application is built with TypeScript, React, and integrates with Google Drive API for comprehensive file management capabilities.

## System Architecture

### Frontend Architecture
- **Framework**: Next.js 15.3.4 with App Router
- **Language**: TypeScript with strict configuration
- **UI Framework**: React with shadcn/ui components
- **Styling**: Tailwind CSS with custom design system
- **State Management**: React hooks and context providers
- **Authentication**: NextAuth.js with Google OAuth

### Backend Architecture
- **API Routes**: Next.js API routes for server-side operations
- **Authentication**: NextAuth.js with Google OAuth integration
- **Google Drive Integration**: googleapis package for Drive API operations
- **Middleware**: Custom security and authentication middleware

### Design System
- **Component Library**: shadcn/ui with custom extensions
- **Icons**: Lucide React icons
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Theme Support**: Dark/light mode with next-themes

## Key Components

### Authentication System
- Google OAuth integration via NextAuth.js
- Session management with remember me functionality
- Protected routes with middleware enforcement
- Automatic token refresh handling

### Google Drive Integration
- Full Google Drive API integration
- File operations (create, read, update, delete, move, copy)
- Folder navigation and breadcrumb system
- Advanced search and filtering capabilities
- Drag-and-drop file operations
- Bulk operations support

### User Interface Components
- Data tables with sorting, filtering, and pagination
- File icon system with MIME type detection
- Responsive image handling with lazy loading
- Context menus and dropdown interfaces
- Progress indicators and loading states
- Toast notifications for user feedback

### Performance Optimizations
- Code splitting with lazy imports
- API request throttling and deduplication
- In-memory caching for frequently accessed data
- Image optimization and responsive loading
- Bundle optimization with tree shaking

## Data Flow

### Authentication Flow
1. User initiates Google OAuth login
2. NextAuth.js handles OAuth flow with Google
3. Access tokens stored in session
4. Middleware validates sessions on protected routes
5. Automatic token refresh when needed

### Google Drive Operations
1. Client requests Drive operation via API route
2. Server validates authentication and permissions
3. Google Drive API called with proper error handling
4. Response cached when appropriate
5. Real-time UI updates via optimistic updates

### File Management Flow
1. File list fetched from Google Drive API
2. Data transformed and cached locally
3. UI components render with loading states
4. User interactions trigger API calls
5. Optimistic updates provide immediate feedback

## External Dependencies

### Core Dependencies
- **@auth/core**: Authentication core functionality
- **googleapis**: Google APIs client library
- **next-auth**: Authentication for Next.js
- **@tanstack/react-table**: Data table functionality
- **@dnd-kit/***: Drag and drop operations
- **@radix-ui/***: Accessible UI primitives

### Development Dependencies
- **@typescript-eslint/***: TypeScript linting
- **@testing-library/***: Testing utilities
- **jest**: Testing framework
- **prettier**: Code formatting

### Google API Integration
- **Google Drive API**: File and folder operations
- **Google OAuth 2.0**: User authentication
- **Required Scopes**: `https://www.googleapis.com/auth/drive`

## Deployment Strategy

### Environment Configuration
- Environment variables for Google OAuth credentials
- NextAuth configuration with secure secrets
- Database-free architecture using session tokens
- Support for both development and production environments

### Build Process
- TypeScript compilation with strict type checking
- ESLint validation with custom strict rules
- Bundle optimization and code splitting
- Static asset optimization

### Security Measures
- Content Security Policy (CSP) headers
- HSTS for production environments
- Secure session management
- Input validation and sanitization
- Rate limiting for API endpoints

### Performance Monitoring
- Bundle analysis capabilities
- Test coverage tracking (minimum 80% requirement)
- API response time monitoring
- Memory usage optimization

## User Preferences

Preferred communication style: Simple, everyday language.

## Changelog

Changelog:
- July 04, 2025. Initial setup
- July 4, 2025. Fixed Radio Button Mobile Sizing - enhanced RadioGroupItem with cross-platform sizing controls (min-h-4 min-w-4 max-h-4 max-w-4 shrink-0 flex-none) to prevent abnormal scaling on mobile devices, improved touch-friendly controls matching checkbox sizing system, added consistent 16px base size with better focus states and transitions
- July 4, 2025. Fixed Jest API Utils Test Failures - resolved critical test suite failures by updating outdated test functions to match current implementation, replaced non-existent functions with actual validation functions (validateShareRequest, validateDownloadRequest, validateRenameRequest, getFileIdFromParams), added proper Jest mocking for dependencies, achieved 9/9 passing tests
- July 4, 2025. Enhanced StorageAnalytics UI & Error Handling - implemented consistent Collapsible/ScrollArea pattern across all cards for better space management, added 401 authentication error detection with user-friendly messages, fixed layout breaking issues with long filenames and MIME types using responsive truncation (max-w-[200px] sm:max-w-[300px] etc), added debug info section for duplicate detection troubleshooting, improved mobile layout with proper gap handling
- July 4, 2025. Comprehensive Duplicate Detection & File Interaction - implemented advanced duplicate finder supporting both MD5 hash AND filename matching, added click-to-open functionality for files using webViewLink (opens in new tab), enhanced UI with badges showing "Identical" vs "Same Name" duplicate types, improved type definitions and error handling for comprehensive duplicate analysis, added visual indicators for clickable files
- July 4, 2025. Fixed Google Drive API Fields Issue - resolved missing MD5 checksums and webViewLink by adding custom fields parameter to DriveSearchOptions interface, created STORAGE_ANALYTICS field set including id,name,mimeType,size,md5Checksum,webViewLink,modifiedTime, modified listFiles service to accept custom fields parameter for specialized operations like storage analytics
- July 4, 2025. Implemented Duplicate Action System - added smart selection dialog for duplicate files with All/Newest/Oldest/Largest/Smallest modes, integrated with existing 9 operations system, added "Take Action" button to each duplicate group in StorageAnalytics, created comprehensive file transformation for operations compatibility, debugging operations dialog integration
- July 4, 2025. Enhanced Duplicate UI & Removed Limits - removed Debug Info section from analytics, changed icons from Copy to GitBranch for Duplicate Files and Settings for Action button, removed 100 file limit for duplicate display to show all duplicate files, integrated ItemsDeleteDialog and ItemsMoveDialog for proper bulk operations
- July 4, 2025. Enhanced RegexHelpDialog with Interactive Tester - added tabbed interface with Guide & Tester tabs, implemented live regex testing with sample filenames, added quick-test buttons (⚡) for examples, created comprehensive regex validation and error handling, improved user experience for learning and testing regex patterns
- July 4, 2025. Professional Dialog System Upgrade - completely rebuilt Move/Copy/Delete/Trash/Untrash/Rename/Share/Download/Export dialogs with professional multi-step workflows, added real-time progress tracking with success/failed/skipped counters, implemented comprehensive error handling and cancellation support, enhanced mobile responsiveness with BottomSheet components, created consistent design patterns across all file operation dialogs
- July 4, 2025. Fixed Dialog Functionality Based on Original Design - restored Share Dialog with dropdown menus for Share Method & Permission Level in side-by-side layout, added export dropdown with copyToClipboard/TXT/CSV/JSON options, removed Archive functionality from Download Dialog to focus on direct downloads and export links only, corrected Export Dialog to match original Google Workspace export formats (PDF/DOCX/XLSX/PPTX/ODT/ODS/etc), ensured all dialogs match original user expectations and requirements
- July 4, 2025. Enhanced Share Dialog Consistency & UI - implemented multi-step workflow pattern (Configuration → Processing → Completed) with professional step indicators, added onConfirm prop for consistency with other operation dialogs, enhanced file preview display with proper ScrollArea for unlimited items, improved visual design with cards, proper spacing and responsive layout, fixed UI breaking issues when displaying 10+ files
- July 4, 2025. Implemented Collapsible File Preview for Share Dialog - replaced ScrollArea with Collapsible component for better user control, added smart auto-expand for ≤5 items and manual control for larger sets, enhanced trigger button with clear labels (Show/Hide Selected Items), improved UX with smooth animations and better space management
- July 4, 2025. Fixed UI Responsiveness Issues - closed Collapsible by default for cleaner initial view, fixed step indicator breakout on small screens with responsive flex layout (flex-col sm:flex-row), added proper truncation and flex-shrink controls, hidden arrow indicators on mobile for better space utilization
- July 5, 2025. Simplified Share Dialog Step Indicator - replaced complex multi-step layout with simple "Status: Indicator" format, added color-coded backgrounds (blue/orange/green) for Configuration/Processing/Completed states, removed unnecessary description text from blue box, fixed ScrollArea issues in CollapsibleContent by replacing with native overflow-y-auto for better scroll behavior
- July 5, 2025. Systematic Dialog UI Consistency Upgrade - applied simplified "Status: Indicator" pattern across all 9 operation dialogs (Move, Copy, Delete, Trash, Untrash, Rename, Share, Download, Export), implemented unified color-coded status backgrounds with appropriate icons (blue for setup/configuration, orange for processing, green for completion, red/amber for warnings), enhanced visual consistency and user experience across entire dialog system, improved mobile responsiveness with consistent step indicator layout
- July 5, 2025. Dialog Operations UI Standardization - implementing Collapsible with ScrollArea pattern for Selected Items preview across all operation dialogs following Share Dialog design, removing unnecessary h3 headers that duplicate dialog titles, moving descriptions/warnings to bottom with simplified user-friendly text, adding ChevronDown icons and Collapsible components for consistent expandable item lists
- July 5, 2025. Complete Dialog Filtering System Implementation - fixed ReferenceError and systematic implementation of capability-based filtering across all 9 operation dialogs, updated all CollapsibleContent sections to use filtered arrays (canMoveItems, canCopyItems, etc), corrected operation loops and progress tracking to process only valid items, implemented proper skipped count calculations for filtered items, updated validation messages to reflect filtered selections, enhanced download dialog to use canDownload capability properly
- July 5, 2025. Enhanced Destination Selector & Fixed Copy Operation - replaced folder path display with ID display for better debugging, added auto-validation to URL/ID tab that immediately validates folder access and shows folder name for user confirmation, fixed Copy operation Google Drive API fields format error, enhanced Copy dialog progress tracking with real-time success/failure updates and increased delay to 300ms for better visual feedback
- July 5, 2025. Server-Side Folder Search Implementation - rebuilt folder search API to use Google Drive service instead of client-side filtering, implemented debounced search (300ms) with proper "trashed=false" filtering, removed unnecessary sharedDrives logic as listFiles already includes shared drives, cleaned up unused includeShared parameter, added proper caching with shorter cache time for search results
- July 5, 2025. Folder API Performance Optimization - optimized folder API to use minimal fields ("id,name") instead of fetching unnecessary data like "parents,shared,webViewLink,modifiedTime", simplified frontend interfaces by removing unused properties (path, isShared), removed shared folder badges and ID display for cleaner UI, improved API response time and reduced bandwidth usage
- July 5, 2025. Codebase Cleanup - removed deprecated and backup files including drive-destination-selector-broken.tsx, drive-destination-selector.tsx.backup, operations-dialog-old.tsx, items-share-dialog-broken.tsx, items-download-dialog-broken.tsx, items-export-dialog-broken.tsx to maintain clean codebase, verified no broken imports remain
- July 5, 2025. Drive Toolbar Search Enhancement - implemented always-visible search input like destination selector, added debounced auto-search (300ms) with immediate results, removed complex search expanded panel and search button, simplified search UX with inline clear button, enhanced responsive layout with min/max width constraints
- July 5, 2025. Extended Search Toolbar Implementation - replaced always-visible search input with collapsible extended search, search now appears as icon only and expands on click with auto-focus, auto-collapse when clicking outside, visual indicator (blue background) when active query, significantly reduces toolbar space usage while maintaining full search functionality
- July 5, 2025. Fixed 7 Operation Dialog API Endpoints - corrected DELETE dialog to use POST /api/drive/files/delete instead of DELETE /{id}, fixed TRASH dialog to use /api/drive/files/trash, fixed UNTRASH dialog to use /api/drive/files/untrash, all operations now properly aligned with backend API structure following working MOVE/COPY pattern, systematic review showed RENAME/DOWNLOAD/EXPORT/SHARE were already correctly implemented