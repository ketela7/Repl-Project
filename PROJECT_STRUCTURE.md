# Project Structure

## Overview
This document outlines the organized structure for the Google Drive Pro application, implementing a feature-based architecture for better maintainability and scalability.

## Current Structure (Real-time Updated)

```
src/
├── app/                         # Next.js 15 App Router
│   ├── (main)/                  # Main application layout group
│   │   └── dashboard/           # Dashboard pages
│   │       ├── drive/           # Drive management
│   │       │   ├── _components/ # Drive-specific components
│   │       │   └── page.tsx     # Drive main page
│   │       └── layout.tsx       # Dashboard layout
│   ├── api/                     # API routes
│   │   ├── auth/                # Authentication endpoints
│   │   │   └── [...nextauth]/   # NextAuth handlers
│   │   ├── drive/               # Google Drive API endpoints
│   │   │   ├── files/           # File operations
│   │   │   └── folders/         # Folder operations
│   │   └── health/              # Health check endpoints
│   ├── globals.css              # Global styles
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Landing page
├── components/                  # Reusable UI components
│   ├── auth/                    # Authentication components
│   ├── providers/               # React context providers
│   ├── ui/                      # Base UI components (shadcn/ui)
│   ├── error-boundary.tsx       # Error boundary component
│   ├── file-category-badges.tsx # File categorization
│   ├── file-icon.tsx           # File type icons
│   ├── drive-error-display.tsx # Drive error handling
│   ├── drive-permission-required.tsx # Permission prompts
│   ├── lazy-imports.tsx        # Dynamic imports
│   └── timezone-provider.tsx   # Timezone context
├── core/                       # Core application services
│   ├── config/                 # Configuration files
│   └── index.ts               # Core exports
├── hooks/                      # Custom React hooks
│   ├── use-debounced-value.ts  # Debouncing utility
│   ├── use-intersection-observer.ts # Intersection observer
│   ├── use-mobile.ts           # Mobile detection
│   └── use-timezone.ts         # Timezone utilities
├── lib/                        # Utility libraries
│   ├── actions.ts              # Server actions
│   ├── api-retry.ts            # API retry logic
│   ├── cache.ts                # Caching utilities
│   ├── clipboard.ts            # Clipboard operations
│   ├── config.ts               # Environment config
│   ├── db.ts                   # Database connection
│   ├── middleware.ts           # Auth middleware
│   ├── request-deduplication.ts # Request optimization
│   ├── schema.ts               # Database schema (Drizzle)
│   ├── search-optimizer.ts     # Search optimization
│   ├── session-cache.ts        # Session caching
│   ├── timezone.ts             # Timezone utilities
│   ├── toast.ts                # Toast notifications
│   └── utils.ts                # General utilities
└── shared/                     # Shared resources
    └── index.ts                # Shared exports
```

## Key Architectural Decisions

### File Naming Convention
- Simple kebab-case naming without prefixes or suffixes
- Examples: `drive-manager.tsx`, `file-list.tsx`, `user-profile.tsx`
- Avoid: `enhanced-drive-manager.tsx`, `optimized-file-list.tsx`

### Component Organization
- Feature-based grouping under `_components/` directories
- Shared components in `/components/`
- UI primitives in `/components/ui/`

### API Structure
- RESTful endpoints under `/api/`
- Grouped by feature (auth, drive, health)
- Consistent response formats

### State Management
- TanStack Query for server state
- React hooks for client state
- Custom session caching layer

### Security
- No NEXT_PUBLIC_ environment variables
- Server-side configuration only
- Secure token handling with NextAuth.js

Last Updated: June 24, 2025

## Directory Structure

```
src/
├── features/                    # Feature-based modules
│   ├── drive/                   # Google Drive functionality
│   │   ├── components/          # Drive-specific components
│   │   │   ├── dialogs/         # Modal dialogs for drive operations
│   │   │   ├── drive-manager.tsx
│   │   │   ├── drive-toolbar.tsx
│   │   │   └── drive-data-view.tsx
│   │   ├── hooks/               # Drive-specific hooks
│   │   ├── services/            # Drive API services
│   │   ├── utils/               # Drive utilities
│   │   ├── types/               # Drive type definitions
│   │   └── index.ts             # Feature exports
│   ├── auth/                    # Authentication
│   │   ├── components/          # Auth components
│   │   ├── hooks/               # Auth hooks
│   │   ├── services/            # Auth services
│   │   ├── utils/               # Auth utilities
│   │   ├── types/               # Auth types
│   │   └── index.ts             # Feature exports
│   └── analytics/               # Analytics dashboard
│       ├── components/
│       ├── hooks/
│       ├── services/
│       └── index.ts
├── shared/                      # Shared/common code
│   ├── components/              # Reusable components
│   │   ├── ui/                  # Base UI components (shadcn/ui)
│   │   ├── data-table/          # Data table components
│   │   ├── file-icon.tsx
│   │   ├── file-category-badges.tsx
│   │   └── error-boundary.tsx
│   ├── hooks/                   # Common hooks
│   ├── utils/                   # Utility functions
│   ├── constants/               # Application constants
│   ├── types/                   # Shared type definitions
│   └── index.ts                 # Shared exports
├── core/                        # Core application services
│   ├── config/                  # Configuration files
│   ├── services/                # Core services (cache, retry, etc.)
│   ├── middleware/              # Application middleware
│   ├── utils/                   # Core utilities
│   ├── constants/               # Core constants
│   ├── types/                   # Core types
│   └── index.ts                 # Core exports
├── app/                         # Next.js App Router
│   ├── (main)/                  # Main application routes
│   ├── api/                     # API routes
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── auth.ts                      # NextAuth configuration
└── middleware.ts                # Next.js middleware
```

## Architecture Principles

### 1. Feature-Based Organization
- **Drive Feature**: All Google Drive related functionality
- **Auth Feature**: Authentication and user management
- **Analytics Feature**: Dashboard and monitoring

### 2. Shared Resources
- **Components**: Reusable UI components across features
- **Hooks**: Common React hooks
- **Utils**: Utility functions used by multiple features

### 3. Core Services
- **Configuration**: Environment and app configuration
- **Services**: Infrastructure services (cache, retry, database)
- **Middleware**: Cross-cutting concerns

## Benefits

### 1. Better Organization
- Related code is grouped together
- Clear separation of concerns
- Easier to locate and maintain code

### 2. Improved Scalability
- Features can be developed independently
- Easy to add new features
- Clear boundaries between modules

### 3. Enhanced Maintainability
- Modular architecture
- Centralized exports from each module
- Clear dependency management

### 4. Better Testing
- Features can be tested in isolation
- Shared components have dedicated tests
- Clear test organization

## Migration Strategy

### Phase 1: Create Structure
- Create new directory structure
- Define module boundaries
- Create index files for exports

### Phase 2: Move Components
- Move drive components to features/drive/
- Move auth components to features/auth/
- Move shared components to shared/

### Phase 3: Update Imports
- Update all import statements
- Use centralized exports
- Remove old file references

### Phase 4: Optimize
- Remove redundant code
- Consolidate similar functionality
- Improve type definitions

## Implementation Guidelines

### 1. Barrel Exports
Each feature module exports its public API through index.ts files:
```typescript
// features/drive/index.ts
export { DriveManager } from './components/drive-manager';
export { useDriveFiles } from './hooks/use-drive-files';
```

### 2. Import Conventions
```typescript
// Use feature imports
import { DriveManager } from '@/features/drive';
import { GoogleAuthButton } from '@/features/auth';
import { Button, Card } from '@/shared';
```

### 3. Type Organization
- Feature-specific types in feature modules
- Shared types in shared/types/
- Core types in core/types/

### 4. Service Layer
- Core services in core/services/
- Feature-specific services in feature modules
- Clear service interfaces and contracts

This structure provides a solid foundation for the application's continued growth and maintainability while following modern React and Next.js best practices.