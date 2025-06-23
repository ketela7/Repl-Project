# Professional Google Drive Management Application

A modern, enterprise-grade Google Drive file management application built with Next.js 15, TypeScript, and shadcn/ui components. Features comprehensive file management, intelligent filtering, and real-time synchronization with Google Drive.

## 🚀 Features

### 🔐 Secure Authentication
- **Google OAuth 2.0**: Enterprise-grade authentication with Google accounts
- **Drive API Integration**: Direct access to user's Google Drive with proper permissions
- **Session Management**: Persistent sessions with automatic token refresh
- **Security**: Secure token handling and API key management

### 📁 Comprehensive File Management
- **Complete CRUD Operations**: Upload, download, rename, move, copy, delete
- **Bulk Operations**: Multi-select for batch file operations
- **Folder Navigation**: Intuitive folder browsing with breadcrumb navigation  
- **File Preview**: In-app preview for images, documents, and media files
- **File Details**: Comprehensive metadata including permissions and sharing info
- **Drag & Drop**: Modern file upload with drag-and-drop interface

### 🔍 Advanced Search & Intelligent Filtering
- **Real-time Search**: Instant search with Google Drive's query syntax
- **Smart File Type Filters**: Filter by documents, images, videos, spreadsheets, etc.
- **Advanced Filter Options**:
  - File size range filtering (B, KB, MB, GB)
  - Date range filtering (creation/modification dates)  
  - Owner-based filtering
  - Sort options (name, date, size, type)
- **View Modes**: All Files, My Drive, Shared, Starred, Recent, Trash
- **Filter Persistence**: Remember filter preferences across sessions

### 📱 Responsive & Accessible Design
- **Mobile-First**: Optimized touch interface for mobile devices
- **Desktop Experience**: Full-featured desktop interface with keyboard shortcuts
- **Adaptive Layouts**: Grid and table views that adapt to screen size
- **Accessibility**: WCAG 2.1 compliant with screen reader support
- **Dark/Light Themes**: System preference detection with manual override

### ⚡ Performance & User Experience
- **Optimized Loading**: Intelligent caching and pagination for fast performance
- **Progressive Enhancement**: Load more content as user scrolls
- **Error Handling**: Graceful error recovery with user-friendly messages
- **Loading States**: Smooth skeleton screens and loading indicators
- **Real-time Updates**: Automatic refresh when Drive content changes
- **Offline Capabilities**: Basic offline functionality for viewed files

### 🎨 Modern UI/UX
- **shadcn/ui Components**: Professional, accessible component library
- **Smooth Animations**: Micro-interactions and page transitions
- **Toast Notifications**: Non-intrusive feedback system
- **Contextual Menus**: Right-click context menus for quick actions
- **Keyboard Navigation**: Full keyboard accessibility support

## 🛠 Technology Stack

### Frontend Architecture
- **Next.js 15**: React framework with App Router and Server Components
- **TypeScript**: Full type safety and enhanced developer experience
- **Tailwind CSS**: Utility-first CSS framework for consistent styling
- **shadcn/ui**: Modern, accessible component library
- **React Hook Form + Zod**: Type-safe form validation
- **TanStack Query**: Advanced data fetching and caching
- **Framer Motion**: Smooth animations and transitions

### Backend & Integration
- **Next.js API Routes**: Server-side API endpoints with Edge Runtime support
- **Google Drive API v3**: Direct integration with Google's file storage
- **NextAuth.js**: Robust authentication with multiple providers
- **PostgreSQL + Drizzle ORM**: Type-safe database operations
- **Edge Functions**: Serverless functions for optimal performance

### Development Tools & Quality
- **ESLint + Prettier**: Code formatting and linting
- **Jest + Testing Library**: Comprehensive testing suite
- **Husky + lint-staged**: Pre-commit hooks for code quality
- **TypeScript Strict Mode**: Maximum type safety
- **GitHub Actions**: CI/CD pipeline for automated testing and deployment

## 🚀 Quick Start

### Prerequisites
- **Node.js 18+** and npm/yarn
- **Google Cloud Platform** account with Drive API access
- **PostgreSQL database** (local or hosted)

### Installation

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd google-drive-manager
   npm install
   ```

2. **Environment Configuration**
   ```bash
   cp .env.example .env.local
   ```
   
   Configure the following variables:
   ```env
   # Authentication
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-secure-secret-key
   
   # Google OAuth
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   
   # Database
   DATABASE_URL=postgresql://user:pass@localhost:5432/dbname
   
   # Optional
   NODE_ENV=development
   ```

3. **Google Cloud Setup**
   - Create project in [Google Cloud Console](https://console.cloud.google.com/)
   - Enable Google Drive API and Google+ API
   - Create OAuth 2.0 credentials
   - Configure authorized redirect URIs:
     - Development: `http://localhost:3000/api/auth/callback/google`
     - Production: `https://yourdomain.com/api/auth/callback/google`

4. **Database Setup**
   ```bash
   npm run db:push  # Apply database schema
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

## 📁 Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── (main)/dashboard/        # Main dashboard application
│   │   └── drive/              # Drive management interface
│   ├── api/                    # Server-side API routes
│   │   ├── auth/              # Authentication endpoints
│   │   └── drive/             # Google Drive API integration
│   └── globals.css            # Global styles and CSS variables
├── components/                  # Reusable React components
│   ├── ui/                    # shadcn/ui base components
│   ├── auth/                  # Authentication components
│   ├── drive/                 # Drive-specific components
│   └── layout/                # Layout components
├── lib/                        # Utility libraries and configurations
│   ├── google-drive/          # Google Drive API integration
│   ├── auth.ts               # NextAuth configuration
│   ├── db.ts                 # Database configuration
│   └── utils.ts              # Helper utilities
├── hooks/                      # Custom React hooks
├── types/                      # TypeScript type definitions
└── styles/                     # Additional stylesheets
```

## 🔧 Key Features Implementation

### File Operations Architecture
```typescript
// Unified file operations with error handling
const fileOperations = {
  upload: async (files: FileList) => { /* Upload implementation */ },
  download: async (fileId: string) => { /* Download implementation */ },
  delete: async (fileIds: string[]) => { /* Bulk delete implementation */ },
  move: async (fileIds: string[], targetFolderId: string) => { /* Move implementation */ }
};
```

### Advanced Filtering System
```typescript
// Type-safe filter system
interface FilterOptions {
  fileTypes: FileType[];
  sizeRange: { min?: number; max?: number; unit: SizeUnit };
  dateRange: { from?: Date; to?: Date };
  viewStatus: 'all' | 'owned' | 'shared' | 'starred' | 'recent' | 'trash';
  sortBy: 'name' | 'modified' | 'created' | 'size';
  sortOrder: 'asc' | 'desc';
}
```

### Google Drive API Integration
```typescript
// Optimized API calls with caching
const driveService = {
  listFiles: async (options: ListFilesOptions) => { /* Implementation */ },
  searchFiles: async (query: string) => { /* Search implementation */ },
  getFileMetadata: async (fileId: string) => { /* Metadata implementation */ }
};
```

## 📱 Mobile Optimization

### Touch-Friendly Interface
- **Large Touch Targets**: Minimum 44px touch targets for all interactive elements
- **Swipe Gestures**: Intuitive swipe actions for file operations
- **Mobile Navigation**: Bottom sheet navigation for mobile devices
- **Pull-to-Refresh**: Native pull-to-refresh functionality

### Performance Optimizations
- **Image Lazy Loading**: Efficient loading of file thumbnails
- **Virtual Scrolling**: Handle large file lists efficiently
- **Service Worker**: Offline functionality and caching
- **Progressive Web App**: Installable web app experience

## 🔒 Security Features

### Data Protection
- **Secure Token Storage**: Encrypted token storage with automatic rotation
- **API Rate Limiting**: Protection against abuse and quota exhaustion
- **Input Validation**: Comprehensive input sanitization and validation
- **CSRF Protection**: Built-in CSRF protection for all forms

### Privacy Compliance
- **Minimal Data Collection**: Only collect necessary user data
- **Data Encryption**: All sensitive data encrypted in transit and at rest
- **User Consent**: Clear consent flows for data access
- **Right to Delete**: User data deletion capabilities

## 🚀 Deployment Options

### Replit Deployment (Recommended)
1. **One-Click Deploy**: Direct deployment from Replit
2. **Built-in Database**: Integrated PostgreSQL database
3. **Environment Management**: Secure secrets management
4. **Auto-scaling**: Automatic scaling based on usage

### Vercel Deployment
1. **GitHub Integration**: Automatic deployments from Git
2. **Edge Functions**: Global edge network deployment
3. **Environment Variables**: Secure environment configuration
4. **Custom Domains**: Easy custom domain setup

### Docker Deployment
```dockerfile
# Production-ready Docker configuration included
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 🧪 Testing Strategy

### Test Coverage
- **Unit Tests**: Component and utility function testing
- **Integration Tests**: API endpoint and database testing
- **E2E Tests**: Complete user workflow testing
- **Performance Tests**: Load testing and performance benchmarks

### Testing Commands
```bash
npm run test          # Run unit tests
npm run test:watch    # Watch mode for development
npm run test:coverage # Generate coverage reports
npm run test:e2e      # Run end-to-end tests
```

## 🔧 Advanced Configuration

### Performance Tuning
```javascript
// next.config.js optimizations
const nextConfig = {
  experimental: {
    turbo: true,                    // Enable Turbopack
    serverComponentsExternalPackages: ['sharp']
  },
  images: {
    domains: ['lh3.googleusercontent.com'],
    formats: ['image/webp', 'image/avif']
  },
  compress: true,
  poweredByHeader: false
};
```

### Database Optimizations
```sql
-- Optimized database indexes
CREATE INDEX idx_files_user_modified ON files(user_id, modified_time DESC);
CREATE INDEX idx_files_type ON files(mime_type);
CREATE INDEX idx_files_size ON files(size);
```

## 📊 Monitoring & Analytics

### Performance Monitoring
- **Core Web Vitals**: Automatic tracking of performance metrics
- **Error Tracking**: Comprehensive error logging and alerting
- **User Analytics**: Privacy-respecting usage analytics
- **API Monitoring**: Google Drive API usage and rate limiting

### Health Checks
```typescript
// Built-in health check endpoints
GET /api/health        // Application health status
GET /api/health/db     // Database connectivity
GET /api/health/drive  // Google Drive API status
```

## 🤝 Contributing

### Development Workflow
1. **Fork & Clone**: Fork the repository and clone locally
2. **Feature Branch**: Create feature branches for new work
3. **Code Quality**: Ensure tests pass and code follows style guide
4. **Pull Request**: Submit PR with clear description and tests

### Code Standards
- **TypeScript**: Strict mode with comprehensive type coverage
- **ESLint Rules**: Extended from Next.js and accessibility standards
- **Commit Convention**: Conventional commits for clear history
- **Documentation**: JSDoc comments for all public APIs

## 📄 License & Support

**License**: MIT License - see [LICENSE](LICENSE) file for details

**Support Channels**:
- 📖 **Documentation**: Comprehensive guides and API reference
- 🐛 **Issues**: GitHub Issues for bug reports and feature requests
- 💬 **Discussions**: GitHub Discussions for questions and community
- 📧 **Security**: security@yourproject.com for security issues

---

**Built with modern web technologies and best practices for enterprise-grade file management.**