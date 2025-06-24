# Google Drive Pro - Replit Configuration

## Overview

Google Drive Pro is a modern, enterprise-grade Google Drive file management application built with Next.js 15, TypeScript, and shadcn/ui components. The application provides comprehensive file management capabilities with intelligent filtering, secure authentication, and a responsive design optimized for both desktop and mobile devices.

## System Architecture

### Frontend Architecture
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript with strict mode enabled
- **UI Library**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design system
- **State Management**: TanStack Query for server state and React hooks for client state
- **Responsive Design**: Mobile-first approach with adaptive layouts

### Backend Architecture
- **API Routes**: Next.js API routes in `src/app/api/`
- **Authentication**: NextAuth.js with Google OAuth 2.0
- **Database**: PostgreSQL with Drizzle ORM (configured but not fully implemented)
- **Session Management**: Custom session caching with Redis-like patterns
- **External API**: Google Drive API integration for file operations

### Feature-Based Architecture
The application uses a modular, feature-based architecture:
- **Features**: Organized by domain (drive, auth, analytics)
- **Shared**: Common components, hooks, and utilities
- **Core**: Application-wide services and configuration

## Key Components

### Authentication System
- **Provider**: Google OAuth 2.0 with offline access
- **Scopes**: OpenID, email, profile, and Google Drive API access
- **Session Handling**: JWT tokens with refresh token support
- **Middleware**: Route protection and automatic token refresh

### Google Drive Integration
- **API Client**: Custom Google Drive API wrapper
- **File Operations**: Complete CRUD operations (create, read, update, delete)
- **Batch Operations**: Multi-select bulk operations
- **Real-time Updates**: Automatic refresh on Drive content changes
- **Error Handling**: Comprehensive error recovery with user-friendly messages

### UI Components
- **Design System**: Based on shadcn/ui with custom extensions
- **Responsive**: Mobile-first design with touch-friendly interactions
- **Accessibility**: WCAG 2.1 compliant with screen reader support
- **Theming**: Dark/light mode support with system preference detection

### Performance Optimizations
- **Caching**: Intelligent caching with session-based storage
- **Lazy Loading**: Code splitting and progressive loading
- **Optimization**: Bundle optimization with Turbopack
- **Error Boundaries**: Graceful error handling with fallback UI

## Data Flow

### Authentication Flow
1. User initiates login via Google OAuth
2. NextAuth handles OAuth flow and token exchange
3. Tokens stored in encrypted JWT session
4. Middleware validates sessions on protected routes
5. Automatic token refresh on expiration

### Drive Operations Flow
1. User actions trigger API calls to Next.js routes
2. Server-side validation and authentication check
3. Google Drive API calls with proper error handling
4. Response processing and caching
5. UI updates with optimistic updates where appropriate

### State Management
- **Server State**: TanStack Query for API data with caching
- **Client State**: React hooks for UI state
- **Session State**: Custom session cache for user data
- **Form State**: React Hook Form for form management

## External Dependencies

### Core Dependencies
- **next**: ^15.0.0 - React framework
- **react**: ^18.0.0 - UI library
- **typescript**: ^5.0.0 - Type safety
- **tailwindcss**: ^3.0.0 - Styling
- **next-auth**: ^4.0.0 - Authentication
- **@tanstack/react-query**: ^5.0.0 - Server state management

### UI Dependencies
- **@radix-ui/react-***: Component primitives
- **lucide-react**: Icon library
- **class-variance-authority**: Variant management
- **tailwind-merge**: Utility merging

### Development Dependencies
- **eslint**: Code linting
- **prettier**: Code formatting
- **jest**: Testing framework
- **@testing-library/react**: Component testing
- **husky**: Git hooks

## Deployment Strategy

### Development Environment
- **Runtime**: Node.js 20
- **Package Manager**: npm
- **Dev Server**: Next.js dev server with Turbopack
- **Hot Reload**: Automatic refresh on file changes

### Production Build
- **Build Command**: `npm run build`
- **Start Command**: `npm start`
- **Optimization**: Automatic code splitting and tree shaking
- **Static Generation**: Pre-rendered pages where possible

### Environment Configuration
- **Environment Variables**: Managed through `.env` files
- **Secrets**: Google OAuth credentials and NextAuth secret
- **Database**: PostgreSQL connection string (when implemented)
- **Caching**: Redis or similar for session storage

### Platform-Specific Settings
- **Replit**: Configured for Replit deployment with proper port mapping
- **Vercel**: Ready for Vercel deployment with automatic optimization
- **Docker**: Containerization support for consistent deployment

## User Preferences

Preferred communication style: Simple, everyday language.

### Development Standards
- No NEXT_PUBLIC_ prefix - only use private secrets
- Simple file naming without prefixes/suffixes (drive-manager.tsx ✅, enhanced-drive-manager.tsx ❌)
- Always ensure project is clean when starting
- Thorough testing before commits
- Professional code quality standards
- Well-structured project organization
- Update README.md for public understanding of changes

## Recent Changes

- June 24, 2025: Initial setup with Google Drive authentication
- June 24, 2025: Updated project rules - no NEXT_PUBLIC_ prefix, only private secrets
- June 24, 2025: Simplified file naming (removed "optimized" prefix from theme provider)
- June 24, 2025: Fixed ESLint configuration and migrated to flat config
- June 24, 2025: All tests passing (76 test cases), TypeScript compilation successful
- June 24, 2025: Project cleaned and verified to follow professional standards

## Changelog

- June 24, 2025: Project rules updated for professional development standards
- June 24, 2025: Codebase cleaned up to follow new naming conventions
- June 24, 2025: Environment variables secured (no client-side exposure)