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