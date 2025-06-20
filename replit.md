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

- June 20, 2025: **Professional Floating Toolbar Implementation Complete**:
  - **Breadcrumb Navigation**: Successfully positioned above Card Data view with proper spacing for clear hierarchy
  - **Enhanced Batch Menu**: Complete bulk operations including Rename Selected, Restore Selected, Export Selected, Move to Trash, Permanently Delete with improved clear selection functionality
  - **Advanced Filter System**: 
    - Active filter status indicator with visual highlighting and "Active" badge
    - Complete File Types including Folder option with icons
    - Interactive Advanced Filters with input fields for size range (min/max with unit selector), date ranges (created/modified with calendar inputs), and owner name/email search
    - Clear Advanced and Clear All filter buttons for easy reset
  - **Streamlined Table Columns**: Successfully removed Starred and Permission columns as requested, focusing on core columns (Name, Size, MIME Type, Owner, Created, Modified)
  - **Visual Enhancements**: Active filter highlighting, proper badge indicators, and improved UX throughout
  - **Technical Implementation**: Added FileBreadcrumb component import, Settings icon import, Input component integration, and proper error handling
  - All menu items fully functional with Google Drive API integration working properly

- June 20, 2025: **Mobile-First Cross-Platform Enhancement Complete**:
  - **Audio Icon Consistency**: Fixed audio file icons to use Music icon instead of generic file icon for better visual consistency across all file types
  - **Enhanced Mobile Filters**: Completely redesigned mobile filter bottom sheet with:
    - Comprehensive basic menu (All Files, My Drive, Shared, Starred, Recent, Trash) with proper icons and descriptions
    - File type filters in 2-column grid layout with color-coded icons
    - Collapsible advanced filters with size range, date ranges, and owner search
    - Touch-friendly buttons with proper spacing and visual feedback
  - **Mobile Actions Enhancement**: Added "Permanently Delete" option to mobile batch actions menu for complete feature parity with desktop
  - **Cross-Platform Dialog System**: Implemented responsive dialog components that automatically switch between desktop dialogs and mobile bottom sheets based on screen size detection
  - **Touch-Friendly Interface**: Enhanced all interactive elements with proper touch targets (44px minimum) and mobile-optimized spacing and padding
  - **Error Handling**: Fixed TypeError issues with proper null checking in filter components
  - **Code Quality**: Improved mobile component architecture with consistent naming and proper TypeScript types

- June 20, 2025: **Complete Cross-Platform Dialog Consistency Implementation**:
  - **Share Dialog Mobile Support**: Enhanced both single-item and bulk share dialogs with full mobile BottomSheet integration
  - **Permanent Delete Dialog**: Added cross-platform support with mobile-optimized confirmation flow and safety checks
  - **Filter Dialog Enhancement**: Completely redesigned Filter Dialog with cross-platform consistency:
    - Replaced mobile-only bottom sheet with unified FiltersDialog component
    - Added collapsible sections for View Status, File Types, and Advanced Filters for cleaner UI
    - Desktop uses Dialog, mobile uses BottomSheet with automatic useIsMobile detection
    - Advanced filters include: Size range (min/max + unit), Created date range, Modified date range, Owner search
    - Visual consistency with color-coded icons and proper touch targets
    - Fixed hasActiveFilters error and duplicate function implementations
    - Enhanced filter handling to support both array and single value file type filters
  - **Enhanced Share Dialog for Bulk Operations**: Upgraded bulk sharing functionality:
    - Replaced basic bulk share dialog with feature-rich Enhanced Share Dialog
    - Added support for bulk operations with progress tracking and individual item results
    - Unified UI between single and multiple item sharing with consistent invite links and permissions
    - Cross-platform mobile/desktop consistency maintained with proper bulk operation indicators
  - **Unified Dialog Pattern**: All dialogs now follow consistent cross-platform architecture:
    - Desktop: Uses Dialog components with proper header icons and structured layout
    - Mobile: Uses BottomSheet with touch-optimized headers and footer buttons
    - Automatic device detection with useIsMobile hook
    - Consistent visual design with color-coded icon badges
    - Proper content rendering shared between both platforms
  - **Enhanced UX Consistency**: All dialogs maintain visual and functional parity across devices with proper spacing, typography, and interaction patterns
  - **Mobile-First Design**: Touch targets, scrolling areas, and button layouts optimized for mobile interaction

- June 20, 2025: **Permanently Delete Menu Logic Fixed**:
  - **Enhanced getFileActions Logic**: Updated permanent delete availability criteria to be more user-friendly:
    - Now available for items in trash (regardless of ownership for safety)
    - Also available for items with delete capability (owner files)
    - Simplified logic removes overly restrictive conditions
  - **Bulk Operations Menu**: Fixed bulk permanent delete visibility to use getFileActions instead of manual ownership checks
  - **Mobile Actions Integration**: Added permanent delete option to mobile bottom sheet with proper styling and warning indicators
  - **Consistent Implementation**: Both desktop dropdown and mobile bottom sheet now show permanent delete option when appropriate
  - **View Status Filter Fix**: Corrected FiltersDialog to call handleViewChange properly instead of just setting state, ensuring view changes actually refresh data

- June 20, 2025: **Google Drive API Capabilities Logic Simplification**:
  - **Direct API Capabilities**: Menggunakan capabilities langsung dari Google Drive API tanpa logic tambahan
  - **Simplified getFileActions**: Hanya canDownload dan canDetails yang perfect, sisanya langsung dari API
  - **Consistent Bulk Operations**: Bulk actions sekarang menggunakan getFileActions untuk setiap item
  - **Single Source of Truth**: getFileActions menjadi satu-satunya logic untuk menentukan actions
  - **API-First Approach**: Logic sederhana yang mengikuti spesifikasi Google Drive API resmi
  - **Better Maintenance**: Update sekali di getFileActions, otomatis apply ke single dan bulk operations

- June 20, 2025: **Share API Parameter Fix**:
  - **Fixed Invalid Parameter**: Mengganti 'anyoneWithLink' dengan 'anyone' sesuai Google Drive API v3 spec
  - **Proper Type Mapping**: Enhanced share dialog menggunakan mapping yang benar untuk permission types
  - **API Compliance**: Share functionality sekarang mengikuti dokumentasi resmi Google Drive API