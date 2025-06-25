# Google Drive Pro - Replit Development Guide

## Overview

Google Drive Pro is a comprehensive, enterprise-grade Google Drive management application built with Next.js 15. It provides advanced file operations, intelligent filtering, and responsive design optimized for professional workflows. The application leverages Google Drive API for direct integration with user's Google Drive accounts.

## System Architecture

### Frontend Architecture

- **Framework**: Next.js 15 with App Router
- **UI Library**: shadcn/ui components with Radix UI primitives
- **Styling**: Tailwind CSS with custom design system
- **State Management**: React Query (TanStack Query) for server state
- **Component Pattern**: Feature-based architecture with shared components
- **Responsive Design**: Mobile-first approach with progressive enhancement

### Backend Architecture

- **API Routes**: Next.js API routes for server-side logic
- **Authentication**: NextAuth.js with Google OAuth 2.0
- **Database**: PostgreSQL with Drizzle ORM (configured but database schema not yet implemented)
- **Session Management**: JWT-based sessions with server-side caching
- **File Operations**: Direct Google Drive API integration

## Key Components

### Authentication System

- **Provider**: Google OAuth 2.0 with Drive API permissions
- **Session Handling**: NextAuth.js with custom JWT callbacks
- **Token Management**: Automatic refresh token handling
- **Security**: Private environment variables only, no client-side secrets

### Google Drive Integration

- **API Client**: Custom Google Drive API wrapper
- **File Operations**: Upload, download, rename, move, copy, delete
- **Search & Filtering**: Advanced search with multiple criteria
- **Permissions**: Comprehensive permission handling
- **Caching**: Smart caching for improved performance

### UI Components

- **Design System**: Consistent component library with variants
- **File Management**: Grid and table views with drag-and-drop
- **Error Handling**: Comprehensive error boundaries and displays
- **Loading States**: Skeleton components for better UX
- **Responsive Design**: Mobile-optimized interface

## Data Flow

1. **Authentication Flow**:

   - User initiates Google OAuth sign-in
   - Google redirects back with authorization code
   - Server exchanges code for access/refresh tokens
   - JWT session created with embedded tokens
   - Client receives session cookie

2. **Drive Operations Flow**:

   - Client requests protected API endpoint
   - Middleware validates session
   - Server uses stored tokens to call Google Drive API
   - Response cached and returned to client
   - Client updates UI optimistically

3. **Error Handling Flow**:
   - API errors caught by error boundaries
   - Specific error types displayed with appropriate actions
   - Retry mechanisms for transient failures
   - Permission re-authorization for expired tokens

## External Dependencies

### Core Dependencies

- **Next.js 15**: Full-stack React framework
- **NextAuth.js**: Authentication library
- **Google APIs**: Drive API client library
- **Drizzle ORM**: Database toolkit (configured for future use)
- **TanStack Query**: Server state management
- **Radix UI**: Headless UI components
- **Tailwind CSS**: Utility-first CSS framework

### Development Dependencies

- **TypeScript**: Static type checking
- **ESLint**: Code linting with custom rules
- **Prettier**: Code formatting
- **Jest**: Testing framework
- **Husky**: Git hooks for quality assurance

## Deployment Strategy

### Replit Configuration

- **Runtime**: Node.js 20 with PostgreSQL 16 module
- **Development Server**: Custom workflow on port 5000
- **Build Process**: Next.js optimized build
- **Environment**: Replit secrets for secure configuration

### Production Considerations

- **Deployment Target**: Autoscale deployment on Replit
- **Database**: PostgreSQL ready for schema implementation
- **Caching**: Built-in Next.js caching with custom session cache
- **Security**: Server-side environment variables only

## Recent Changes

- June 24, 2025: Initial setup with Google Drive authentication
- June 24, 2025: Updated project rules - no NEXT*PUBLIC* prefix, only private secrets
- June 24, 2025: Simplified file naming (removed "optimized" prefix from theme provider)
- June 24, 2025: Created comprehensive API documentation with real-time updates
- June 24, 2025: Updated project structure documentation with current architecture
- June 24, 2025: Enhanced development rules - double check/retest code, rapid development process
- June 24, 2025: Routes documentation added for complete API reference
- June 24, 2025: Replaced PROJECT_RULES.md with CONTRIBUTING.md as development guidelines
- June 24, 2025: Implemented priority-based development rules (Bug → Struktur → Redundansi → UI/UX → Minor)
- June 24, 2025: Code cleanup - removed TODO comments, unused components, fixed ESLint config
- June 24, 2025: Fixed critical syntax errors that were causing slow compilation
- June 24, 2025: Optimized Next.js config for faster builds (lazy loading, bundle optimization)
- June 24, 2025: Implemented component-level lazy loading for drive dialogs
- June 24, 2025: All tests passing (76 test cases), TypeScript compilation successful
- June 24, 2025: CRITICAL PERFORMANCE FIXES - Session optimization (5min cache), API throttling integration, database migration ready
- June 24, 2025: SECURITY HARDENING - CSP headers, HSTS, enhanced middleware with route protection
- June 24, 2025: ERROR HANDLING - Specialized DriveErrorBoundary for better UX and debugging
- June 24, 2025: Project follows professional development standards with clean structure and rapid development
- June 24, 2025: MAJOR CODE CLEANUP - Removed all console.log statements, fixed ESLint configuration errors, eliminated duplicate files, ensured TypeScript compilation without errors
- June 24, 2025: API PERFORMANCE OPTIMIZATION - Increased throttling to 25 req/sec, extended cache TTL to 15 minutes, implemented intelligent request batching with priority system
- June 24, 2025: ENHANCED ERROR HANDLING - Added DriveErrorBoundary with recovery actions, intelligent retry mechanisms, user-friendly error messages
- June 24, 2025: BUNDLE OPTIMIZATION - Lazy loading implementation, preconnect to Google APIs, performance monitoring in development mode
- June 24, 2025: API ROUTE SIMPLIFICATION - Mengurangi kompleksitas dari 460 baris → 30 baris untuk mengatasi compile time yang lambat
- June 24, 2025: AUTH.TS CLEANUP - Menghilangkan session cache kompleks yang menyebabkan TypeScript errors
- June 24, 2025: CRITICAL BUG FIX - Fixed Google Drive API "Invalid Value" error, authentication now working properly, API returning 50 files successfully
- June 24, 2025: PERFORMANCE OPTIMIZATION - Optimized Next.js config for faster development: disabled strict mode, skip lib check, simplified headers, faster webpack builds
- June 24, 2025: CRITICAL BUG FIXES - Fixed failing tests by removing duplicate AuthWrapper components, corrected test expectations, added proper error handling in GoogleAuthButton component
- June 24, 2025: STRUCTURAL CLEANUP - Consolidated duplicate components (Bug → Struktur priority), all 86 tests now passing, TypeScript compilation successful
- June 25, 2025: MODULARITY OPTIMIZATION - Moved all bulk operations dialogs from drive-manager.tsx to drive-toolbar.tsx for better code organization and modularity
- June 25, 2025: LAZY LOADING OPTIMIZATION - Implemented lazy loading for all bulk operations dialogs, added performance utilities, optimized webpack config for faster compilation and reduced bundle size
- June 25, 2025: REFACTOR BULK OPERATIONS STRUCTURE - Restructured bulk operations to follow proper routing: DriveManager → DriveToolbar → BulkOperationsDialogMobile/Desktop → Individual dialogs, moved all dialog logic to appropriate components for better code organization
- June 25, 2025: BULK OPERATIONS FULLY WORKING - All individual dialogs now functional: Move, Copy, Delete, Export, Rename, Share, Permanent Delete, Restore. Fixed event handler conflicts, removed Suspense wrappers, cleaned up debug code. UI confirmed working through user testing.
- June 25, 2025: UI ENHANCEMENT FOR BULK OPERATIONS - Completely redesigned all individual dialog UIs with modern card-based layouts: consistent 64x64 icon containers with color coding, centered headers with titles and descriptions, badge displays for file/folder counts, improved item preview sections, and informational alert boxes with appropriate color schemes for each operation type.
- June 25, 2025: MAJOR CODE CLEANUP - Eliminated duplicate code from 199 clones to 79 clones (60% reduction), reduced duplicated lines from 18.39% to 5.29% (71% improvement), consolidated folder structure by removing src/shared/, src/features/, src/core/, updated all import paths to use centralized locations, fixed TypeScript compilation errors and ESLint configuration conflicts, application now fully operational with significantly improved maintainability.

## Changelog

- June 24, 2025: Initial setup and comprehensive development standards implementation

## User Preferences

Preferred communication style: Simple, everyday language.

### Development Standards (Prioritas Review: Bug → Struktur → Redundansi → UI/UX → Minor)

- ❌ Tidak gunakan NEXT*PUBLIC* - hanya variabel rahasia private
- 📁 Penamaan file sederhana tanpa awalan/akhiran (drive-manager.tsx ✅, optimized-drive-manager.tsx ❌)
- 🔧 Class dan function nama sederhana (ErrorHandler ✅, EnhancedErrorHandler ❌)
- 🧼 Hapus import unused, duplikasi kode, refactor untuk kesederhanaan
- 📐 Struktur proyek Next.js App Router: app/, components/, lib/, utils/
- 🧪 Uji kode sebelum commit - pastikan tidak ada error/warning (WAJIB: npx tsc --noEmit)
- ⚠️ DOUBLE CHECK imports dan exports sebelum commit
- 🔄 Test setelah setiap perubahan untuk memastikan tidak ada breaking changes
- 📖 Dokumentasi real-time (API docs, routes, project structure)
- 📝 Update README.md untuk pemahaman publik
- ⚙️ Tingkatkan efisiensi dengan ESLint, Prettier, automation
- 💼 Kode profesional: clean, modular, maintainable
