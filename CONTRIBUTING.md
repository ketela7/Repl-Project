# Contributing to Google Drive Pro

## Quick Start for Contributors

### Code Quality Requirements

**Before submitting any code, run these commands:**

```bash
# Check code quality (required before commits)
npm run lint

# Auto-fix common issues
npx eslint target --fix

# Type check
npm run type-check
```

## ESLint Rules - Code Quality Standards

### Mandatory Checks Before Contribution

1. **No ESLint Errors**: All ESLint errors must be fixed
2. **No Unused Imports**: Remove all unused imports and variables
3. **TypeScript Strict**: All TypeScript errors must be resolved
4. **Security Rules**: Follow security best practices

### Quick ESLint Commands

```bash
# Fast lint check (development)
npm run lint:fast

# Full lint with all rules  
npm run lint

# Auto-fix unused imports and formatting
npm run lint:fix
```

### Core ESLint Rules You Must Follow

#### 1. Clean Code Rules
- ✅ Remove unused imports: `unused-imports/no-unused-imports`
- ✅ Remove unused variables: `unused-imports/no-unused-vars`
- ✅ Use const instead of let: `prefer-const`
- ✅ No console.log in production: `no-console`

#### 2. TypeScript Rules
- ✅ Avoid `any` type: `@typescript-eslint/no-explicit-any`
- ✅ Use optional chaining: `@typescript-eslint/prefer-optional-chain`
- ✅ Use nullish coalescing: `@typescript-eslint/prefer-nullish-coalescing`

#### 3. Security Rules
- ✅ No unsafe regex: `security/detect-unsafe-regex`
- ✅ No eval expressions: `security/detect-eval-with-expression`
- ✅ Validate user input: `security/detect-object-injection`

#### 4. React Rules
- ✅ Accessible components: `jsx-a11y/alt-text`, `jsx-a11y/aria-props`
- ✅ Proper React patterns: No React.FC, use functional components

### File Naming Convention

- **Files**: kebab-case (`drive-manager.tsx`, `file-list.tsx`)
- **Components**: PascalCase (`DriveManager`, `FileList`)
- **Variables**: camelCase (`fileName`, `fileList`)
- **Constants**: UPPER_CASE (`API_BASE_URL`, `MAX_FILES`)

### Environment Variables

- **❌ Never use NEXT_PUBLIC_**: All config must be server-side only
- **✅ Use Replit secrets**: For API keys and sensitive data
- **✅ Server-side only**: Handle all configuration securely on server

## Development Workflow

### Pre-Commit Checklist

Before submitting any contribution, ensure you complete ALL steps:

```bash
# 1. Run ESLint check (REQUIRED)
npm run lint

# 2. Fix any ESLint errors
npx eslint target_dir --fix

# 3. Check TypeScript (REQUIRED)
npm run type-check

# 4. Test your changes
npm run dev
```

### Available Lint Workflows

The project includes optimized lint workflows to handle timeout issues:

- **Quick Lint**: `npm run lint:fast` - Fast development checks  
- **Optimized Lint**: Use the "Optimized Lint" workflow - development with relaxed warnings
- **Lint Strict**: `npm run lint` - Full production-ready linting

### ESLint Error Fixes

Common ESLint errors and how to fix them:

#### Unused Imports
```javascript
// ❌ Wrong - unused import
import { useState, useEffect } from 'react'

function MyComponent() {
  return <div>Hello</div>
}

// ✅ Correct - remove unused imports
function MyComponent() {
  return <div>Hello</div>
}
```

#### TypeScript `any` Usage
```typescript
// ❌ Wrong - avoid any
const data: any = fetchData()

// ✅ Correct - define proper types
interface UserData {
  id: string
  name: string
}
const data: UserData = fetchData()
```

#### Security Issues
```javascript
// ❌ Wrong - potential injection
const regex = new RegExp(userInput)

// ✅ Correct - validate input
const regex = /^[a-zA-Z0-9]+$/
if (regex.test(userInput)) {
  // safe to use
}
```

## Architecture Rules

### Component Structure

- **Extend existing components** instead of creating new ones
- **Single responsibility** - one clear purpose per component
- **TypeScript interfaces** for all props
- **Error boundaries** for error handling

### API Guidelines

- All API routes in `src/app/api/`
- Use NextAuth middleware for protected routes
- Consistent error response format
- Input validation on all endpoints

### Performance Requirements

- Initial page load < 2 seconds
- Code splitting with lazy loading
- Bundle size monitoring
- Mobile-first responsive design

## Quality Standards

### Testing Requirements

- 70% minimum code coverage for new features
- Unit tests for all utility functions
- Integration tests for critical user flows
- Component testing for UI interactions

### Documentation

- Update README.md for project changes
- Document all API endpoints
- JSDoc comments for complex functions
- Maintain architecture decision records

## Troubleshooting

### ESLint Issues

If ESLint workflows fail or timeout:

1. Run `npm run lint:fast` for faster checks
2. Use `npm run lint:fix` to auto-fix issues
3. Use the "Quick Lint" workflow for optimized processing
4. Check `scripts/optimized-lint-workflow.js` for configuration

### TypeScript Errors

Common TypeScript fixes:
- Add proper type annotations
- Use `as const` for literal types
- Define interfaces for complex objects
- Avoid `any` types when possible

---

**Last Updated**: July 1, 2025  
**Version**: 2.0  
**Focus**: Simple ESLint rules for clean code contributions

## Architecture Guidelines

### Component Design

- **Extend Over Create**: Always extend existing components rather than creating new ones
- **Single Responsibility**: Each component should have one clear purpose
- **Props Interface**: Define clear TypeScript interfaces for all props
- **Composition**: Prefer composition over inheritance

### API Structure

- **Route Organization**: API routes only in `src/app/api/`
- **Error Handling**: Consistent error response format
- **Authentication**: All protected routes must use NextAuth middleware
- **Validation**: Input validation on all API endpoints

### Database Operations

- **Drizzle ORM**: Use Drizzle for all database operations
- **Migrations**: Use `npm run db:push` for schema changes
- **No Raw SQL**: Avoid direct SQL queries except for complex operations
- **Type Safety**: Use generated types from Drizzle schema

## Design Requirements

### Mobile-First Approach

- **Touch Targets**: Minimum 44px touch targets for interactive elements
- **Responsive Design**: Test on mobile, tablet, and desktop
- **Bottom Sheets**: Use bottom sheets for mobile actions, dialogs for desktop
- **Gesture Support**: Implement appropriate touch gestures

### Accessibility Standards

- **WCAG 2.1 AA**: Maintain AA compliance
- **Keyboard Navigation**: Full keyboard accessibility
- **Screen Readers**: Proper ARIA labels and descriptions
- **Color Contrast**: Minimum 4.5:1 contrast ratio

### Cross-Platform Compatibility

- **Device Testing**: Test on multiple devices and browsers
- **Progressive Enhancement**: Core functionality works without JavaScript
- **Performance**: Optimize for various network conditions
- **Offline Support**: Implement offline capabilities where applicable

## Testing Standards

### Coverage Requirements

- **Minimum Coverage**: 70% code coverage for all new features
- **Unit Tests**: Test all utility functions and hooks
- **Integration Tests**: Test critical user flows
- **Component Tests**: Test component rendering and interactions

### Performance Standards

#### Loading Performance

- **Initial Load**: Target <2s for initial page load
- **Code Splitting**: Implement lazy loading for heavy components
- **Bundle Size**: Monitor and optimize bundle size
- **Image Optimization**: Use Next.js Image component

#### Runtime Performance

- **Memory Usage**: Monitor memory consumption
- **API Response**: Target <1s for API responses
- **Caching Strategy**: Implement intelligent caching
- **Database Queries**: Optimize database operations

#### Mobile Performance

- **Touch Response**: Immediate visual feedback for touch events
- **Animation Performance**: Use CSS transforms for animations
- **Network Optimization**: Minimize API calls on mobile
- **Battery Efficiency**: Avoid excessive background processing

## Documentation Standards

### Code Documentation

- **README**: Comprehensive project setup and usage
- **API Documentation**: Document all API endpoints
- **Component Props**: Document all component interfaces
- **Architecture**: Maintain architecture decision records

### User Documentation

- **Feature Guides**: Step-by-step user guides
- **Troubleshooting**: Common issues and solutions
- **Changelog**: Document all feature changes
- **Deployment**: Clear deployment instructions

## Development Workflow

### Git Workflow

- **Branch Strategy**: Feature branches from main
- **Commit Messages**: Clear, descriptive commit messages
- **Pull Requests**: Required for all changes
- **Code Review**: Mandatory peer review

### Continuous Integration

- **Automated Testing**: All tests must pass
- **Type Checking**: TypeScript compilation required
- **Linting**: ESLint checks must pass
- **Build Verification**: Production build must succeed

### Deployment Process

- **Environment Parity**: Test in production-like environment
- **Database Migrations**: Safe migration strategies
- **Rollback Plan**: Always have rollback capability
- **Monitoring**: Monitor application health post-deployment

## User Experience Requirements

### Loading States

- **Skeleton Loaders**: Use skeleton loaders for content loading
- **Progress Indicators**: Show progress for long operations
- **Error States**: Clear error messages with recovery options
- **Empty States**: Meaningful empty state messaging

### Interaction Design

- **Feedback**: Immediate feedback for user actions
- **Consistency**: Consistent interaction patterns
- **Accessibility**: Keyboard and screen reader support
- **Mobile Touch**: Optimized touch interactions

### Data Integrity

- **Authentic Data**: Only use real data from authorized sources
- **Error Handling**: Graceful error handling with recovery options
- **Validation**: Client and server-side validation
- **Backup Strategy**: Data backup and recovery procedures

---

**Last Updated**: June 24, 2025  
**Version**: 1.0  
**Enforcement**: Mandatory for all contributors
