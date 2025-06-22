# Project Structure Guide

## Google Drive Management Application - Clean Architecture

This document outlines the organized project structure following Next.js 13+ App Router conventions and clean architecture principles.

---

## 📁 Directory Structure

```
src/
├── app/                          # Next.js App Router (Pages & API Routes)
│   ├── (main)/                   # Route groups for authenticated pages
│   │   ├── auth/                 # Authentication pages
│   │   └── dashboard/            # Main application dashboard
│   ├── api/                      # API routes (ONLY location for API endpoints)
│   │   ├── auth/                 # Authentication API endpoints
│   │   ├── drive/                # Google Drive API endpoints
│   │   └── health/               # Health check endpoints
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout component
│   └── page.tsx                  # Home page
├── components/                   # Reusable React components
│   ├── auth/                     # Authentication components
│   ├── data-table/               # Data table components
│   ├── navigation/               # Navigation components
│   ├── providers/                # React context providers
│   ├── ui/                       # Shadcn/ui components
│   └── *.tsx                     # Shared utility components
├── config/                       # Configuration files
│   └── app-config.ts             # Application configuration
├── hooks/                        # Custom React hooks
│   ├── __tests__/                # Hook tests
│   └── *.ts                      # Custom hooks
├── lib/                          # Utility libraries and core logic
│   ├── google-drive/             # Google Drive integration
│   ├── __tests__/                # Library tests
│   ├── actions.ts                # Server actions
│   ├── cache.ts                  # Caching utilities
│   ├── clipboard.ts              # Clipboard functionality
│   ├── config.ts                 # Environment configuration
│   ├── db.ts                     # Database connection
│   ├── middleware.ts             # Custom middleware
│   ├── schema.ts                 # Database schema
│   ├── session.ts                # Session management
│   ├── timezone.ts               # Timezone utilities
│   ├── toast.ts                  # Toast notifications
│   └── utils.ts                  # General utilities
├── __tests__/                    # Integration tests
├── auth.ts                       # NextAuth configuration
└── middleware.ts                 # Next.js middleware
```

---

## 🎯 Key Architecture Principles

### API Routes Structure
- **ONLY** `src/app/api/` contains API routes (Next.js App Router standard)
- **NO** `src/api/` directory (removed duplicate structure)
- All API endpoints follow REST conventions
- Proper HTTP methods and status codes

### Component Organization
- **Components**: Reusable UI components in `src/components/`
- **Pages**: Route components in `src/app/(main)/`
- **Layouts**: Layout components in route directories
- **Navigation**: Centralized in `src/components/navigation/`

### Library Structure
- **Core Logic**: Business logic in `src/lib/`
- **Utilities**: Helper functions grouped by purpose
- **Services**: External API integrations (Google Drive)
- **Actions**: Server actions in `src/lib/actions.ts`

### Configuration Management
- **Environment**: Centralized in `src/lib/config.ts`
- **App Config**: Application constants in `src/config/app-config.ts`
- **Type Safety**: All configurations are type-safe

---

## 🔧 File Naming Conventions

### General Rules
- **kebab-case**: For all files and directories
- **Descriptive names**: Clear, purpose-driven naming
- **No prefixes**: Avoid "enhanced-", "utils-", etc.
- **Consistent patterns**: Follow established conventions

### Component Files
```
✅ Good Examples:
- drive-manager.tsx
- file-details-dialog.tsx
- google-auth-button.tsx

❌ Avoid:
- enhanced-drive-manager.tsx
- utils-file-details.tsx
- component-google-auth.tsx
```

### Utility Files
```
✅ Good Examples:
- toast.ts
- clipboard.ts
- timezone.ts
- session.ts

❌ Avoid:
- toast-utils.ts
- clipboard-utilities.ts
- timezone-helpers.ts
- session-management.ts
```

---

## 📦 Import Path Standards

### Absolute Imports (Preferred)
```typescript
import { toast } from '@/lib/toast'
import { DriveManager } from '@/components/drive-manager'
import { APP_CONFIG } from '@/config/app-config'
```

### Relative Imports (Only when needed)
```typescript
import { NavItem } from './nav-item'
import { SidebarProps } from '../types'
```

---

## 🧪 Testing Structure

### Test Organization
- **Unit Tests**: Alongside source files in `__tests__/` subdirectories
- **Integration Tests**: In root `__tests__/` directory
- **Component Tests**: In `src/components/__tests__/`
- **Hook Tests**: In `src/hooks/__tests__/`

### Test File Naming
```
✅ Good Examples:
- timezone.test.ts
- google-auth-button.test.tsx
- auth-flow.test.tsx

❌ Avoid:
- timezone-utils.test.ts
- enhanced-auth.test.tsx
- component-test-auth.tsx
```

---

## 🎨 Component Architecture

### Component Types
1. **Page Components**: Route-level components in `app/(main)/`
2. **Layout Components**: Shared layouts and shells
3. **Feature Components**: Domain-specific components
4. **UI Components**: Reusable Shadcn/ui components
5. **Provider Components**: Context providers

### Component Composition
- **Single Responsibility**: Each component has one clear purpose
- **Composition over Inheritance**: Use composition patterns
- **Props Interface**: Well-defined TypeScript interfaces
- **Error Boundaries**: Proper error handling

---

## 🚀 Performance Considerations

### Code Organization for Performance
- **Lazy Loading**: Components loaded as needed
- **Code Splitting**: Automatic route-based splitting
- **Tree Shaking**: Proper export/import patterns
- **Bundle Size**: Minimal dependencies and utilities

### Caching Strategy
- **API Responses**: Cached in `src/lib/cache.ts`
- **Static Assets**: Next.js automatic optimization
- **Database Queries**: Optimized with Drizzle ORM

---

## 🔐 Security Architecture

### File Security
- **Environment Variables**: Properly configured in `src/lib/config.ts`
- **API Routes**: Protected with middleware
- **Input Validation**: Comprehensive sanitization
- **Error Handling**: Secure error responses

### Authentication Flow
- **NextAuth.js**: Centralized authentication
- **JWT Tokens**: Secure session management
- **OAuth Integration**: Google Drive API access
- **Middleware Protection**: Route-level security

---

## 📋 Maintenance Guidelines

### Code Quality
- **TypeScript**: Strict type checking enabled
- **ESLint**: Consistent code style
- **Prettier**: Automatic formatting
- **Testing**: Comprehensive test coverage

### Documentation
- **README**: Project overview and setup
- **Code Comments**: JSDoc for complex functions
- **Type Definitions**: Clear interface documentation
- **Architecture**: This structure guide

---

## 🔄 Migration Notes

### Recent Changes
- ✅ Removed duplicate `src/api/` directory
- ✅ Moved server actions to `src/lib/actions.ts`
- ✅ Moved middleware to `src/lib/middleware.ts`
- ✅ Reorganized navigation to `src/components/navigation/`
- ✅ Simplified file naming conventions
- ✅ Updated all import references

### Breaking Changes
- Import paths updated for moved files
- API structure simplified to App Router standard
- File naming conventions standardized

---

*Last Updated: December 2024*  
*Architecture: Next.js 13+ App Router with TypeScript*