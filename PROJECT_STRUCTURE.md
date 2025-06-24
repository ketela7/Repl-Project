# Project Structure

## Overview
This document outlines the new organized structure for the Google Drive Management application, implementing a feature-based architecture for better maintainability and scalability.

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