
# Project Rules & Guidelines

## Professional Google Drive Management Application

**Last Updated**: December 2024  
**Project Type**: Professional Next.js + Google Drive API Integration  
**Architecture**: Full-stack web application with NextAuth.js authentication

---

## 🏗️ Environment & Configuration

### Environment Variables
- **Handle without NEXT_PUBLIC_ prefixes** - All environment variables are stored in Replit secrets
- **Direct access pattern**: Use `process.env.VARIABLE_NAME` for server-side components
- **Configuration centralization**: Utilize `src/lib/config.ts` for environment management
- **Validation required**: All environment variables must be validated on startup

### Required Environment Variables
```bash
# Authentication (NextAuth.js)
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
NEXTAUTH_SECRET
NEXTAUTH_URL

# Database
DATABASE_URL
```

---

## 📁 Code Optimization & File Structure

### Extension Priorities

#### ✅ **High Priority (Always Extend)**
- `src/lib/google-drive/utils.ts` - Core utilities
- `src/lib/google-drive/service.ts` - API service methods
- `src/components/ui/` - Shadcn components
- `src/app/(main)/dashboard/drive/_components/drive-manager.tsx` - Main component

#### ⚠️ **Medium Priority (Consider Extension)**
- Custom hooks in `src/hooks/`
- Type definitions in `src/lib/google-drive/types.ts`
- Configuration files

#### 🔄 **Low Priority (OK to Create New)**
- Page components (`page.tsx`)
- Route handlers (`/api/`)
- Completely different feature domains

### Anti-Patterns to Avoid

#### ❌ **Don't Create**
- New utility files for similar logic
- Duplicate components with slight variations
- Separate service classes for related functionality
- Multiple files for single feature

#### ✅ **Do Instead**
- Extend existing utilities with options
- Compose existing components
- Add methods to existing services
- Consolidate related functionality

---

## 🎨 UI/UX Design Standards

### Color Scheme: "Balanced Professional"
- **Primary Colors**: Professional blue palette
- **Secondary Colors**: Neutral grays with accent colors
- **Contextual Coloring**: 
  - Success: Green variants
  - Warning: Amber variants
  - Error: Red variants
  - Info: Blue variants

### Cross-Platform Compatibility
- **Responsive Design**: Mobile-first approach with touch optimization
- **Browser Support**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Mobile Support**: iOS Safari 14+, Android Chrome 90+
- **Progressive Web App**: PWA capabilities enabled
- **Touch Targets**: Minimum 44px for mobile interactions

### Icon Strategy
- **Icon Library**: Lucide React exclusively
- **Size Strategy**: Consistent sizing for cross-platform compatibility
  - Small: 16px (w-4 h-4)
  - Medium: 20px (w-5 h-5)
  - Large: 24px (w-6 h-6)
  - Extra Large: 32px (w-8 h-8)

### Component Standards
- **Shadcn/ui**: Primary component library
- **Tailwind CSS**: Utility-first styling
- **Cross-Platform Dialogs**: Bottom sheets for mobile, dialogs for desktop
- **Theme Support**: Dark/light mode compatibility
- **Accessibility**: WCAG 2.1 AA compliance

---

## 🔧 Development Standards

### Writing Style: Professional Coder
- **TypeScript**: Strict type checking enabled
- **Code Quality**: ESLint + Prettier configuration
- **Documentation**: Comprehensive JSDoc comments
- **Error Handling**: Graceful error boundaries and user feedback

### Testing Requirements
- **Always test results**: Ensure everything works correctly before completion
- **End-to-end validation**: Test complete user workflows
- **Cross-browser testing**: Verify functionality across supported browsers
- **Mobile testing**: Validate responsive behavior and touch interactions

### File Naming Conventions
- **kebab-case**: For all files except configuration
- **Descriptive names**: Clear, purpose-driven naming
- **Consistent patterns**: Follow established project structure

---

## 🔐 Security & Authentication

### Authentication Flow (NextAuth.js)
- **NextAuth.js Integration**: Primary authentication method with Google OAuth
- **Session Management**: JWT-based sessions with 30-day persistence
- **Token Security**: Secure storage and automatic refresh
- **Scope Management**: Minimal required Google Drive permissions

### Session Management Features
- **Extended Sessions**: 30-day login persistence with "Keep me logged in" option
- **Automatic Renewal**: Token refresh without user intervention
- **Secure Storage**: JWT tokens with proper encryption
- **Cross-Device**: Session persistence across devices

### Data Protection
- **HTTPS Enforcement**: All communications encrypted
- **Input Validation**: Comprehensive sanitization
- **CSRF Protection**: Built-in Next.js protection
- **Error Information**: Limited details in production

### File Handling Implementation
- **No Archive Libraries**: Direct download links for memory-efficient file transfer
- **Size Filtering**: Client-side implementation since Google Drive API lacks server-side size filtering support
- **Bulk Operations**: Parallel processing with comprehensive error handling and progress tracking
- **Folder Size**: Folders treated as 0 bytes in size range filtering
- **Smart Menu Logic**: Download operations only available for files, not folders
- **Permission-Based Actions**: Trash/Delete operations based on ownership and sharing status
- **Cross-Platform Toolbar**: Responsive design with mobile-first approach and consistent icon sizing
- **Shortcut Support**: Internal navigation and preview for Google Drive shortcuts

---

## 🚀 Performance & Optimization

### Frontend Optimizations
- **Code Splitting**: Automatic route-based splitting
- **Image Optimization**: Next.js built-in optimization
- **Caching Strategy**: Strategic API response caching
- **Lazy Loading**: Component and route lazy loading
- **Parallel Processing**: Up to 5x faster bulk operations

### Backend Optimizations
- **API Efficiency**: Optimized Google Drive API usage with batching
- **Database Queries**: Efficient Drizzle ORM operations
- **Response Compression**: Automatic compression
- **Error Boundaries**: Prevent cascading failures
- **Session Optimization**: Efficient JWT token management

### Caching Strategy
- **Memory Cache**: In-memory caching for API responses
- **TTL Management**: Configurable time-to-live settings
- **Cache Keys**: Structured key generation for Drive API
- **Cleanup Processes**: Automatic cache maintenance

---

## 📊 Data Management

### Database Schema
- **Drizzle ORM**: Type-safe database operations
- **PostgreSQL**: Primary database system
- **Migration Strategy**: Use `npm run db:push` for schema changes
- **Data Integrity**: Comprehensive validation and constraints

### API Integration
- **Google Drive API**: Core file management functionality
- **Rate Limiting**: Respect API quotas and limits
- **Error Handling**: Robust error recovery mechanisms
- **Token Refresh**: Automatic token management with NextAuth.js

---

## 🔄 Development Workflow

### Git Workflow
- **Feature Branches**: Isolated feature development
- **Code Review**: Mandatory peer review process
- **Commit Messages**: Conventional commit format
- **Branch Protection**: Main branch protection enabled

### Build Process
- **Next.js Build**: Optimized production builds
- **Type Checking**: Pre-build TypeScript validation
- **Linting**: Automated code quality checks
- **Testing**: Automated test execution

### Deployment
- **Replit Hosting**: Primary deployment platform (port 5000)
- **Environment Variables**: Secure secret management
- **Health Checks**: Automated deployment validation
- **Rollback Strategy**: Quick rollback capabilities

---

## 📋 Quality Assurance

### Code Quality
- **ESLint Configuration**: Comprehensive linting rules
- **Prettier Integration**: Consistent code formatting
- **Type Safety**: Strict TypeScript enforcement
- **Security Scanning**: Automated vulnerability detection

### Testing Strategy
- **Unit Tests**: Component and utility testing
- **Integration Tests**: API endpoint validation
- **E2E Tests**: Complete user workflow testing
- **Performance Tests**: Load and stress testing
- **Mobile Testing**: Cross-platform validation

### Documentation Requirements
- **README Updates**: Always update project documentation
- **API Documentation**: Comprehensive endpoint documentation
- **Component Documentation**: JSDoc comments for all components
- **Change Logs**: Detailed change tracking

---

## 🛠️ Maintenance & Updates

### Regular Tasks
- **Dependency Updates**: Monthly security updates
- **Performance Monitoring**: Ongoing performance tracking
- **Error Monitoring**: Proactive error detection
- **User Feedback**: Regular user experience assessment

### Code Review Checklist
- [ ] TypeScript strict mode compliance
- [ ] Proper error handling implementation
- [ ] Security best practices followed
- [ ] Performance optimization applied
- [ ] Cross-platform compatibility verified
- [ ] Mobile responsiveness tested
- [ ] Documentation updated
- [ ] Tests passing
- [ ] Accessibility requirements met

---

## 📚 Resources & References

### Documentation
- [Next.js Documentation](https://nextjs.org/docs)
- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Google Drive API](https://developers.google.com/drive/api)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [Tailwind CSS](https://tailwindcss.com/docs)

### Tools & Libraries
- **Framework**: Next.js 15 with App Router
- **Authentication**: NextAuth.js + Google OAuth
- **Database**: PostgreSQL with Drizzle ORM
- **UI Components**: Shadcn/ui + Radix UI
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Notifications**: Sonner

---

**Note**: This document serves as the definitive guide for project development. All team members must adhere to these guidelines to ensure consistency, quality, and maintainability of the codebase.

## 🔄 Recent Updates (December 2024)

### Authentication Migration
- Complete migration from Supabase to NextAuth.js
- Extended session management with 30-day persistence
- Enhanced security with JWT token management
- Streamlined Google OAuth integration

### Performance Enhancements
- Parallel bulk operations implementation (up to 5x faster)
- Smart caching improvements
- Resource optimization for Replit deployment
- Server health monitoring system

### Mobile & Cross-Platform
- Touch-optimized interface design
- Cross-platform dialog system (bottom sheets for mobile)
- Responsive design improvements
- Native UI patterns for each platform
