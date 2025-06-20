
# Professional Google Drive Management

A streamlined, professional web application for managing Google Drive files and folders with enterprise-grade UI design. Built with Next.js 15, TypeScript, and optimized for cross-platform performance on Replit.

## 🚀 Project Status: Production Ready & Optimized

### Current Version
- **Framework**: Next.js 15.3.4 with App Router
- **TypeScript**: 5.8.3 (Strict mode)  
- **React**: 19.1.0
- **Database**: PostgreSQL with Drizzle ORM 0.44.2
- **Deployment**: Replit Optimized for Performance

## ✨ Features

### 📁 File Operations
- **Create Folders**: Intuitive folder creation with smart naming
- **File Management**: Comprehensive CRUD operations for files and folders
- **View Files**: Direct preview in Google Drive's web viewer
- **Enhanced Media Preview**: 
  - **Images**: High-quality display with zoom capabilities
  - **Videos**: Embedded streaming player with controls
  - **Audio**: Built-in streaming audio player
  - **Documents**: Inline PDF and office document viewer
  - **Google Workspace**: Native preview for Docs, Sheets, Slides
- **Download Files**: Direct download with proper MIME type handling
- **Rename Operations**: Interactive dialog with smart text selection
- **Move Files/Folders**: Drag-and-drop with folder selection dialog
- **Copy Files**: Intelligent duplication with automatic naming
- **Delete Operations**: 
  - **Trash**: Standard Google Drive trash functionality
  - **Permanent Delete**: Secure permanent deletion with confirmation
  - **Context-Aware**: Smart menu display based on permissions
- **Restore Files**: One-click restore from trash
- **File Details**: Comprehensive metadata display including:
  - File information (name, type, size, ID, version)
  - Creation/modification history with user details
  - Ownership and sharing permissions
  - Security checksums (MD5, SHA1, SHA256)
  - EXIF metadata for images (camera, GPS, technical specs)
  - Video metadata (resolution, duration, aspect ratio)
  - File capabilities and access restrictions

### 🔄 Bulk Operations System
- **Smart Selection**: Multi-select with floating action toolbar
- **Parallel Processing**: Intelligent concurrent processing for safe operations
- **Operation Preview**: Pre-execution analysis showing:
  - Items to process vs. skip with detailed reasons
  - Estimated completion time and resource usage
  - Grouped skip reasons for better understanding
- **Bulk Download**: Multi-file download with:
  - Batch processing (up to 5 files simultaneously)
  - Automatic filtering (folders and unsupported files skipped)
  - Real-time progress with time estimates
- **Bulk Export**: Google Workspace file export to multiple formats:
  - PDF, DOCX, XLSX, PPTX, ODT, ODS, PNG, JPEG
  - Smart format filtering based on source file types
  - Automatic download management
- **Bulk Rename**: Advanced renaming patterns:
  - Prefix/suffix addition to existing names
  - Sequential numbering with custom base names
  - Timestamp integration for organization
  - Live preview before execution
- **Bulk Operations**: Move, copy, delete, restore with:
  - Comprehensive error handling and retry logic
  - Individual item status tracking
  - Performance metrics and completion reports
  - Database audit trail for all operations

### 🔍 Smart Navigation & Search
- **Breadcrumb Navigation**: Visual hierarchy with clickable path elements
- **Folder Browsing**: Intuitive click-to-navigate folder structure
- **Advanced Search**: Comprehensive search across all files and folders
- **Smart Filtering System**:
  - **Quick Filters**: All Files, My Drive, Shared, Starred, Recent, Trash
  - **File Type Filters**: Documents, Spreadsheets, Presentations, Images, Videos, Audio, Archives, Code
  - **Advanced Filters**:
    - Size range filtering with client-side optimization
    - Date range filtering with intuitive date picker
    - Owner filtering by name or email
    - Real-time filter application across all views

### 🎨 User Interface & Experience
- **File Category Badges**: Visual file type overview with smart filtering
- **Dual View System**: Toggle between grid and table layouts
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Theme Support**: Light mode with professional styling
- **Smart Loading States**: Skeleton loaders and progress indicators
- **Error Handling**: Comprehensive error boundaries with recovery options
- **Toast Notifications**: Contextual feedback with operation details
- **Cross-Platform**: Perfect mobile and desktop experience

### 🔐 Authentication & Security
- **Google OAuth Integration**: Secure authentication flow
- **Token Management**: Automatic refresh and validation
- **Scope Verification**: Minimal required permissions
- **Session Management**: Persistent authentication across sessions
- **CSRF Protection**: Built-in Next.js security features
- **Input Validation**: Comprehensive sanitization and validation

## 🛠️ Technology Stack

### Frontend Architecture
- **Next.js 15.3.4**: React framework with App Router
- **TypeScript 5.8.3**: Strict type safety and modern features
- **React 19.1.0**: Latest React with concurrent features
- **Tailwind CSS 4.1.5**: Utility-first styling with custom configuration
- **Shadcn/ui**: Premium component library built on Radix UI
- **Lucide React 0.453.0**: Modern icon system
- **next-themes 0.4.6**: Seamless theme switching

### Backend Integration
- **Next.js API Routes**: Server-side endpoint handling
- **Google APIs 150.0.1**: Official Google Drive API integration
- **Supabase 2.50.0**: Authentication and session management
- **Drizzle ORM 0.44.2**: Type-safe database operations
- **PostgreSQL**: Robust relational database
- **Cloudflare Turnstile**: Advanced CAPTCHA protection

### Performance & Optimization
- **Lightweight Architecture**: Streamlined codebase for optimal performance
- **Cache System**: Smart caching with intelligent TTL management
- **Cross-Platform**: Optimized for mobile, tablet, and desktop
- **Fast Loading**: Optimized bundle size and efficient rendering
- **Responsive Design**: Smooth performance across all device types

### Development Ecosystem
- **ESLint 9.29.0**: Advanced code quality and consistency
- **Prettier 3.5.3**: Code formatting with Tailwind plugin
- **Husky 9.1.7**: Git hooks for quality assurance
- **TypeScript ESLint**: Advanced TypeScript-specific linting
- **Lint-staged**: Pre-commit code quality checks

## 📁 Project Architecture

```
src/
├── app/                                # Next.js App Router
│   ├── (main)/                         # Authenticated application
│   │   ├── auth/                       # Authentication flows
│   │   ├── dashboard/                  # Main application dashboard
│   │   │   ├── _components/            # Shared dashboard components
│   │   │   ├── drive/                  # Google Drive manager
│   │   │   │   ├── _components/        # Drive-specific components
│   │   │   │   │   ├── drive-manager.tsx           # Main interface
│   │   │   │   │   ├── bulk-*.tsx                  # Bulk operation dialogs
│   │   │   │   │   ├── file-*.tsx                  # File operation components
│   │   │   │   │   └── drive-filters-sidebar.tsx   # Advanced filtering
│   │   │   │   └── page.tsx            # Drive page entry point
│   │   │   └── layout.tsx              # Dashboard layout
│   │   └── unauthorized/               # Access denied page
│   ├── api/                            # Backend API endpoints
│   │   ├── auth/                       # Authentication endpoints
│   │   └── drive/                      # Google Drive API integration
│   └── layout.tsx                      # Root application layout
├── components/                         # Reusable UI components
│   ├── ui/                            # Base UI component library
│   ├── auth/                          # Authentication components
│   └── providers/                     # React context providers
├── lib/                               # Core business logic
│   ├── google-drive/                  # Google Drive service integration
│   │   ├── service.ts                 # Main service class
│   │   ├── types.ts                   # TypeScript definitions
│   │   ├── utils.ts                   # Utility functions
│   │   └── config.ts                  # API configuration
│   ├── supabase/                      # Supabase integration
│   ├── cache.ts                       # Smart caching system
│   └── utils.ts                       # Utility functions
└── middleware.ts                      # Request middleware
```

## 🔌 API Endpoints

### Authentication
- `GET /api/auth/google-drive` - Initiate Google OAuth flow
- `GET /api/auth/check-drive-access` - Verify Drive permissions
- `GET /api/auth/callback` - OAuth callback handler
- `POST /api/auth/logout` - Session termination

### File Operations
- `GET /api/drive/files` - List files and folders with filtering
- `POST /api/drive/files` - Upload new files with progress tracking
- `GET /api/drive/files/[fileId]` - Get detailed file information
- `PUT /api/drive/files/[fileId]` - Update file (rename, move, trash, restore)
- `DELETE /api/drive/files/[fileId]` - Permanently delete file
- `POST /api/drive/files/[fileId]/copy` - Copy file with options

### Advanced Operations
- `GET /api/drive/download/[fileId]` - Secure file download
- `POST /api/drive/files/[fileId]/export` - Export Google Workspace files
- `GET /api/drive/files/[fileId]/details` - Comprehensive file metadata
- `POST /api/drive/folders` - Create folder with validation

### System
- `GET /api/drive/user` - Current user information

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ (managed by Replit)
- npm or yarn package manager
- Google Drive API credentials
- Supabase project setup

### Environment Setup
Configure these environment variables in Replit Secrets:
```bash
DATABASE_URL=your_postgresql_connection_string
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anonymous_key
TURNSTILE_SITE_KEY=your_cloudflare_turnstile_site_key
TURNSTILE_SECRET_KEY=your_cloudflare_turnstile_secret_key
```

### Development Commands
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint

# Format code
npm run format

# Database operations
npm run db:push    # Update database schema
```

## 🔧 Error Handling

### Comprehensive Error Management
- **Client-Side**: Automatic retry mechanisms, graceful degradation
- **Server-Side**: Detailed error mapping, user-friendly messages
- **Authentication**: Automatic token refresh, re-authentication flow
- **API Errors**: Google Drive API error handling with fallbacks
- **Network Issues**: Offline support and connection recovery

### Error Recovery Features
- **Automatic Retries**: Intelligent retry logic for transient failures
- **Fallback UI**: Graceful degradation when services are unavailable
- **Error Boundaries**: React error boundaries preventing app crashes
- **User Feedback**: Clear error messages with actionable instructions

## 🎯 Performance Optimizations

### Frontend Optimizations
- **Code Splitting**: Automatic route and component-based splitting
- **Lazy Loading**: Component and image lazy loading
- **Bundle Optimization**: Webpack optimization for minimal bundle size
- **Caching Strategy**: Intelligent browser and API caching
- **Virtual Scrolling**: Efficient rendering for large file lists

### Backend Optimizations
- **API Batching**: Reduce Google Drive API calls through batching
- **Database Optimization**: Efficient Drizzle ORM queries
- **Response Compression**: Automatic gzip compression
- **Rate Limiting**: Intelligent rate limiting for API protection
- **Background Processing**: Non-blocking operations for better UX

### Deployment Optimizations
- **Replit Optimization**: Specifically tuned for Replit's environment
- **Resource Management**: Memory and CPU usage optimization
- **Port Configuration**: Optimal port setup for Replit deployment
- **Build Optimization**: Fast build times with efficient caching

## 🔒 Security Features

### Data Protection
- **HTTPS Enforcement**: All communications encrypted in transit
- **Token Security**: Secure OAuth token storage and transmission
- **Input Sanitization**: Comprehensive XSS and injection protection
- **CSRF Protection**: Built-in Cross-Site Request Forgery protection

### Access Control
- **OAuth Scopes**: Minimal required Google Drive permissions
- **Session Validation**: Server-side session verification
- **Rate Limiting**: API abuse protection
- **Audit Logging**: Database logging for sensitive operations

## 🌐 Browser Support

### Desktop Browsers
- Chrome 90+ (Recommended)
- Firefox 88+
- Safari 14+
- Edge 90+

### Mobile Support
- iOS Safari 14+
- Android Chrome 90+
- Progressive Web App capabilities

## 📱 Mobile Experience

### Responsive Design
- **Touch Optimization**: Touch-friendly interface elements
- **Mobile Navigation**: Optimized sidebar and navigation
- **Gesture Support**: Swipe gestures for mobile interactions
- **Performance**: Optimized for mobile device constraints

## 🤝 Contributing

### Development Standards
- **TypeScript**: Strict type checking required
- **Code Quality**: ESLint and Prettier enforcement
- **Testing**: Comprehensive testing for new features
- **Documentation**: JSDoc comments for all public APIs

### Code Style
- **Naming**: kebab-case for files, camelCase for variables
- **Components**: Functional components with TypeScript
- **Hooks**: Custom hooks for reusable logic
- **Error Handling**: Comprehensive error boundaries

## 📊 System Features

### Professional Experience
- **File Category Badges**: Visual overview of file types with smart filtering
- **Cross-Platform**: Seamless experience on mobile, tablet, and desktop
- **Fast Performance**: Optimized for quick loading and smooth interactions
- **Clean Interface**: Professional design focused on productivity

## 🚀 Deployment

### Replit Deployment (Recommended)
- **Platform**: Optimized for Replit's infrastructure
- **Port Configuration**: Uses port 3000 (5000 recommended for production)
- **Environment**: All secrets managed through Replit Secrets
- **Streamlined**: Lightweight architecture for optimal performance

### Production Readiness
- **Build Process**: Optimized Next.js production build
- **Error Handling**: Production-grade error management
- **Performance**: Cross-platform optimized for all devices
- **Security**: Production security configurations

## 📄 License

This project is built for educational and professional demonstration purposes. Please ensure compliance with Google Drive API terms of service and applicable data protection regulations.

## 🆘 Support

### Documentation
- Comprehensive inline documentation
- Error messages with actionable guidance
- Performance monitoring and alerting
- Detailed logging for troubleshooting

### Community
- Professional code standards
- Comprehensive testing coverage
- Modern development practices
- Enterprise-grade architecture

---

**Status**: Production Ready ✅  
**Last Updated**: June 2025  
**Platform**: Replit Optimized  
**Version**: 1.1.0

## 🔄 Recent Updates (v1.1.0)

### Enhanced Toolbar & UX Improvements
- **Smart Menu Logic**: Download operations intelligently hide for folder-only selections
- **Permission-Based Actions**: Trash/Delete menus respect ownership and sharing status
- **Cross-Platform Toolbar**: Mobile-optimized with responsive icon sizing (16px standard)
- **Enhanced Filter UI**: Icon-only file type filters for cleaner, space-efficient design
- **Progress Consistency**: Unified progress indicators with blur overlay and better mobile responsiveness
- **View Toggle Prominence**: Grid/Table view switcher moved to main toolbar for better accessibility
