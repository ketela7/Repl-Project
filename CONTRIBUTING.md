# Contributing to Google Drive Pro

## Development Rules

### Environment Variables

- **❌ Jangan gunakan NEXT*PUBLIC***: Hanya gunakan variabel rahasia (private env) secara aman
- **Server-side only**: Semua konfigurasi harus ditangani dengan aman di server
- **Private secrets only**: Gunakan Replit secrets atau server environment variables eksklusif

### File Naming Convention

- **📁 Penamaan sederhana**: Gunakan kebab-case tanpa awalan/akhiran yang tidak perlu
- **Contoh benar**: `drive-manager.tsx`, `drive-toolbar.tsx`, `file-list.tsx`
- **Contoh salah**: `optimized-drive-manager.tsx`, `drive-clean.tsx`, `enhanced-file-list.tsx`

### Code Quality Standards

#### 🧼 Cleanup Requirements

- **Import unused**: Hapus semua import yang tidak digunakan
- **Duplikasi kode**: Refactor kode yang berulang
- **Fungsi tidak terpakai**: Hapus fungsi/komponen yang tidak digunakan
- **ESLint + Prettier**: Auto-fix dengan ESLint

#### TypeScript Requirements

- **Strict Mode**: Selalu gunakan TypeScript strict mode
- **Type Safety**: Hindari `any` types kecuali legacy API
- **Interface Definitions**: Definisikan interface untuk semua struktur data
- **JSDoc Comments**: Dokumentasi untuk fungsi public dan logika kompleks

#### Code Style

- **Naming Convention**: kebab-case untuk file, camelCase untuk variabel
- **Component Structure**: Pola React functional component
- **Error Handling**: Try-catch komprehensif untuk operasi async

### Quality Assurance

- **Clean Project Start**: Always ensure project is clean when starting work
- **Double Check & Retest**: Double check and retest code before committing, ensure it follows project rules and works correctly
- **Rapid Development**: Always improve development process for faster completion
- **Professional Standards**: Work like a professional coder with thorough planning and execution
- **No Errors**: Ensure zero errors in production-ready code
- **Well Structured**: Maintain clean, organized project structure only when safe
- **Real-time Documentation**: Always update API documentation, routes, and project structure in real time
- **README Updates**: Update README.md for any project changes to ensure public understanding

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
