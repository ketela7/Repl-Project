# replit.md

## Overview

This is a Professional Google Drive Management application built with Next.js 15 and shadcn/ui components, featuring a modern and responsive design with Google OAuth authentication via Supabase. The project includes a sophisticated file management system that provides intelligent, professional-grade tools for file organization, search, and interaction. The application uses TypeScript, ESLint, Tailwind CSS 4.x, and includes comprehensive UI components for building enterprise-grade interfaces with integrated cloud storage capabilities.

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
- **Professional Google Drive Management**: Complete file management system with comprehensive features
- **Analytics Dashboard**: Professional monitoring dashboard with 4 tabs (Overview, Performance, Usage Stats, Error Tracking)

### Route Structure
- **Home**: `/` - Landing page with authentication status
- **Main Dashboard**: `/dashboard` - Protected admin interface
- **Google Drive**: `/dashboard/drive` - File management interface
- **Analytics**: `/dashboard/analytics` - System monitoring and analytics
- **Authentication**: `/auth/v1/login` - Google OAuth login
- **Auth Callback**: `/api/auth/callback` - OAuth callback handler

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

- June 18, 2025: **Google Drive Filter System Enhancement**:
  - Fixed Google Drive API filter implementation with proper query syntax
  - Enhanced client-side filtering to complement API limitations
  - Added comprehensive file type filters (document, spreadsheet, presentation, image, video, audio, archive, code)
  - Improved view filters (my-drive, shared, starred, recent, trash) with correct API queries
  - Disabled problematic cache during testing to ensure fresh API calls
  - Fixed Sonner notification close button positioning to stay within notification box

- June 18, 2025: **Analytics Dashboard Implementation**:
  - Removed problematic performance monitor components causing SSR errors
  - Created comprehensive Analytics Dashboard with 4 professional tabs
  - Fixed sidebar navigation to enable Analytics menu access
  - Implemented real-time data visualization with progress bars and status indicators
  - Added refresh functionality and responsive design for mobile compatibility
  - Resolved all JavaScript parsing errors and import reference issues

- June 19, 2025: **Simplified Floating Toolbar Final**:
  - Redesigned to 5 clean menu items: Search | Batch | Filter | Badge | More
  - Search: Toggleable search bar that shows/hides when clicked for clean interface
  - Batch: Dropdown with select mode toggle and bulk operation actions (download, delete, move, copy)
  - Filter: Comprehensive dropdown with Basic Filter (All, My Drive, Recent, Trash, Starred, Shared), File Types, and Advanced options
  - Badge: Floating item counters showing Total and MIME type specific counts with colored icons
  - More: Settings menu with View Mode toggle, Table Column selection (when in table view), Refresh, Create Folder, Upload
  - Fixed positioning that truly stays at top during scroll (position: fixed)
  - Removed old bulk operations floating button as requested
  - Clean, organized interface following user specifications