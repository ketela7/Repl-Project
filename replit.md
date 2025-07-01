# Google Drive Pro - Professional Drive Management

## Overview

Google Drive Pro is a professional-grade Google Drive management application built with Next.js 15, TypeScript, and modern React patterns. It provides enterprise-level file operations with an intuitive user interface for efficient document management. The application leverages Google Drive API for comprehensive file operations including bulk operations, advanced filtering, and collaborative features.

## System Architecture

### Frontend Architecture
- **Framework**: Next.js 15 with App Router for modern React server components
- **UI Library**: Radix UI primitives with shadcn/ui component system
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: React Query (TanStack Query) for server state management
- **Authentication**: NextAuth.js v5 for Google OAuth integration
- **Type Safety**: TypeScript with strict mode enabled for comprehensive type checking

### Backend Architecture
- **API Routes**: Next.js API routes with route handlers
- **Authentication**: Server-side session management with NextAuth.js
- **Google Integration**: googleapis library for Google Drive API operations
- **Error Handling**: Centralized error handling with retry mechanisms
- **Performance**: Request deduplication, throttling, and caching strategies

## Key Components

### Authentication System
- Google OAuth 2.0 integration with drive scope permissions
- Session management with automatic token refresh
- Protected route middleware for secure access
- Fallback handling for authentication failures

### Drive Management
- **File Operations**: Create, read, update, delete operations with bulk support
- **Folder Management**: Hierarchical folder navigation and operations
- **Search & Filtering**: Advanced search with multiple filter criteria
- **Drag & Drop**: Sortable file interface with @dnd-kit integration
- **Real-time Updates**: Optimistic updates with error rollback

### Performance Optimizations
- **Lazy Loading**: Component-level code splitting with React.lazy
- **Caching**: In-memory cache for API responses (60-minute TTL)
- **Throttling**: API request throttling (25 requests/second)
- **Retry Logic**: Exponential backoff for failed requests
- **Bundle Optimization**: Tree shaking and package optimization

### Mobile Responsiveness
- Mobile-first design approach
- Touch-optimized interactions
- Responsive data tables with horizontal scrolling
- Safe area support for modern mobile devices

## Data Flow

### Authentication Flow
1. User initiates Google OAuth through NextAuth.js
2. Google redirects with authorization code
3. NextAuth exchanges code for access/refresh tokens
4. Tokens stored in session for API requests
5. Session validated on protected routes

### Drive Operations
1. UI components trigger operations through API routes
2. API routes authenticate using session tokens
3. GoogleDriveService handles API communication
4. Response cached and returned to client
5. UI updates optimistically with error handling

### Error Handling
1. Errors classified by type (network, auth, quota, etc.)
2. Retryable errors automatically retried with backoff
3. User-friendly error messages displayed
4. Fallback UI components for error states

## External Dependencies

### Core Dependencies
- **Next.js**: Full-stack React framework
- **NextAuth.js**: Authentication solution
- **googleapis**: Google APIs client library
- **Radix UI**: Accessible component primitives
- **TanStack Table**: Data table functionality
- **@dnd-kit**: Drag and drop functionality

### Development Tools
- **TypeScript**: Static type checking
- **ESLint**: Code linting with custom rules
- **Prettier**: Code formatting
- **Jest**: Testing framework with React Testing Library
- **Tailwind CSS**: Utility-first CSS framework

### Google Services Integration
- **Google Drive API**: File and folder operations
- **Google OAuth 2.0**: User authentication
- **Google Fonts**: Web font delivery

## Deployment Strategy

### Environment Configuration
- Server-side environment variables for secrets
- No NEXT_PUBLIC_ variables to maintain security
- Replit secrets integration for development
- Production environment variable validation

### Build Optimization
- TypeScript strict mode compilation
- ESLint validation with error limits
- Bundle analysis for size optimization
- Production-ready security headers

### Performance Monitoring
- Build size analysis scripts
- Code quality checks with coverage thresholds
- Dependency analysis for unused packages
- Production readiness verification scripts

### Development Configuration
- **Strict Development Mode**: Automated ESLint processing with timeout protection
- **Per-Directory Processing**: Individual directory processing to avoid 60-second system timeouts
- **Auto-fix Focus**: Unused imports/variables cleanup for clean development workflow
- **Fast Development Workflows**: Optimized ESLint and TypeScript checking workflows

## Changelog

- July 01, 2025. Initial setup
- July 1, 2025. Configured strict development mode with ESLint per-directory processing - created dev-strict-mode.js script to handle 60-second timeout limitations, implemented individual directory processing for src/app, src/components, src/lib, src/types, and src/middleware, added timeout protection (45s per directory), created Dev Strict Mode and Lint Fast Fix workflows for automated unused imports/variables cleanup, optimized development workflow for fast iteration with clean code standards

## User Preferences

```
Preferred communication style: Simple, everyday language.
ESLint processing: Individual directory processing to avoid 60-second timeouts.
Development approach: Per-directory ESLint processing with timeout protection.
Strict development mode: Automated unused imports/variables cleanup.
Script management: Focus on essential development workflow scripts.
```