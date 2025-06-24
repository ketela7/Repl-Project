# Project Development Rules

## 🎯 Code Quality Standards

### TypeScript Requirements
- **Strict Mode**: Always use TypeScript strict mode
- **Type Safety**: No `any` types except for legacy API compatibility
- **Interface Definitions**: Define interfaces for all data structures
- **JSDoc Comments**: Document all public functions and complex logic

### Code Style
- **ESLint + Prettier**: Mandatory code formatting
- **Naming Convention**: Use kebab-case for files, camelCase for variables
- **Component Structure**: Follow React functional component patterns
- **Error Handling**: Comprehensive try-catch blocks for async operations

### File Organization
```
- Use kebab-case for file names (user-profile.tsx)
- Simple file naming without prefixes or suffixes
  ✅ drive-manager.tsx, drive-toolbar.tsx
  ❌ drive-manager-enhanced.tsx, enhanced-drive-manager.tsx
- Group related components in feature folders
- Keep components under 300 lines when possible
- Separate logic into custom hooks when appropriate
```

### Environment Variables
- **No NEXT_PUBLIC_ prefix**: Only use private secrets, never client-side environment variables
- **Server-side only**: All configuration must be handled securely on the server
- **Private secrets only**: Use Replit secrets or server environment variables exclusively

## 🏗 Architecture Guidelines

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

## 📱 Design Requirements

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

## 🧪 Testing Standards

### Coverage Requirements
- **Minimum Coverage**: 70% code coverage for all new features
- **Unit Tests**: Test all utility functions and hooks
- **Integration Tests**: Test critical user flows
- **Component Tests**: Test component rendering and interactions

### Testing Guidelines
- **Test File Location**: Co-locate tests with source files or in `__tests__` folders
- **Naming Convention**: Use `.test.ts` or `.test.tsx` extensions
- **Mock Strategy**: Mock external dependencies and API calls
- **Test Data**: Use realistic test data, avoid placeholder content

### Quality Checks
```bash
# Before committing, ensure:
npm run lint          # No ESLint errors
npm run type-check    # No TypeScript errors
npm test             # All tests pass
npm run build        # Production build succeeds
```

## 🔒 Security Requirements

### Authentication
- **NextAuth.js**: Use only NextAuth.js for authentication
- **Session Management**: Implement secure session handling
- **JWT Tokens**: Proper token validation and refresh
- **Protected Routes**: Middleware-based route protection

### Data Protection
- **Input Validation**: Validate all user inputs
- **SQL Injection**: Use parameterized queries only
- **XSS Prevention**: Sanitize all user-generated content
- **CSRF Protection**: Enable Next.js built-in CSRF protection

### Environment Security
- **Secret Management**: Use Replit Secrets for sensitive data
- **Environment Variables**: Never commit secrets to version control
- **API Keys**: Validate API key presence and permissions
- **Error Handling**: Limit error details in production

## 🚀 Performance Standards

### Loading Performance
- **Initial Load**: Target <2s for initial page load
- **Code Splitting**: Implement lazy loading for heavy components
- **Bundle Size**: Monitor and optimize bundle size
- **Image Optimization**: Use Next.js Image component

### Runtime Performance
- **Memory Usage**: Monitor memory consumption
- **API Response**: Target <1s for API responses
- **Caching Strategy**: Implement intelligent caching
- **Database Queries**: Optimize database operations

### Mobile Performance
- **Touch Response**: Immediate visual feedback for touch events
- **Animation Performance**: Use CSS transforms for animations
- **Network Optimization**: Minimize API calls on mobile
- **Battery Efficiency**: Avoid excessive background processing

## 📚 Documentation Standards

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

## 🔄 Development Workflow

### Git Workflow
- **Branch Strategy**: Feature branches from main
- **Commit Messages**: Clear, descriptive commit messages
- **Pull Requests**: Required for all changes
- **Code Review**: Mandatory peer review

### Quality Assurance
- **Clean Project Start**: Always ensure project is clean when starting work
- **Recheck & Retest**: Always verify code works before commit
- **Professional Standards**: Work with professional coder discipline
- **No Errors**: Ensure zero errors in production-ready code
- **Well Structured**: Maintain clean, organized project structure
- **Real-time Documentation**: Always update API documentation, routes, and project structure in real time
- **README Updates**: Update README.md for any project changes to ensure public understanding
- **Professional Work**: Work like a professional coder with thorough planning and execution

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

## 🎯 User Experience Requirements

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

**Last Updated**: June 2025  
**Version**: 2.0  
**Enforcement**: Mandatory for all contributors