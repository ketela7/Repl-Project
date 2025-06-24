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
- June 24, 2025: Updated project rules - no NEXT_PUBLIC_ prefix, only private secrets
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
- June 24, 2025: Project follows professional development standards with clean structure and rapid development

## Changelog

- June 24, 2025: Initial setup and comprehensive development standards implementation

## User Preferences

Preferred communication style: Simple, everyday language.

### Development Standards (Prioritas Review: Bug → Struktur → Redundansi → UI/UX → Minor)
- ❌ Tidak gunakan NEXT_PUBLIC_ - hanya variabel rahasia private
- 📁 Penamaan file sederhana tanpa awalan/akhiran (drive-manager.tsx ✅, optimized-drive-manager.tsx ❌)
- 🧼 Hapus import unused, duplikasi kode, refactor untuk kesederhanaan
- 📐 Struktur proyek Next.js App Router: app/, components/, lib/, utils/
- 🧪 Uji kode sebelum commit - pastikan tidak ada error/warning
- 📖 Dokumentasi real-time (API docs, routes, project structure)
- 📝 Update README.md untuk pemahaman publik
- ⚙️ Tingkatkan efisiensi dengan ESLint, Prettier, automation
- 💼 Kode profesional: clean, modular, maintainable