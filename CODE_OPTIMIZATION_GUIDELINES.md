# Code Optimization Guidelines

## Overview
Panduan untuk mengoptimalkan code reuse dan menghindari duplikasi yang tidak perlu dalam development. Prioritaskan extend existing functions/components daripada membuat file/function baru.

## Core Principles

### 1. Before Creating New Files/Functions - Always Check:

#### File Analysis Checklist:
- ✓ Apakah ada utility function yang bisa diextend?
- ✓ Apakah ada existing component yang bisa dimodifikasi?
- ✓ Apakah ada hook yang bisa direuse dengan parameter tambahan?
- ✓ Apakah ada service yang sudah handle similar logic?
- ✓ Apakah bisa menggunakan composition pattern instead of new file?

#### Function Extension Strategy:
```javascript
// BAD: Create new function for similar logic
const formatFileSize = (size) => { /* logic */ };
const formatImageSize = (size) => { /* similar logic */ };

// GOOD: Extend existing function with options
const formatFileSize = (size, options = {}) => {
  const { type = 'file', unit = 'auto' } = options;
  // unified logic dengan customization
};
```

## Project-Specific Optimization Strategies

### A. Utility Functions Consolidation

#### Current Utils yang Bisa Diextend:
- `formatFileSize()` - Add options parameter untuk customization
- `getFileIcon()` - Add support untuk lucide icons dengan options
- `formatDate()` - Add format options untuk different contexts
- `isPreviewable()` - Extend untuk different preview types

#### Extended Utils Pattern:
```javascript
// Existing function yang bisa diextend
export const getFileIcon = (mimeType, options = {}) => {
  const { style = 'emoji', size = 'default', color = 'auto' } = options;
  
  if (style === 'lucide') {
    return getLucideIcon(mimeType, size, color);
  }
  
  // existing emoji logic
  return getEmojiIcon(mimeType);
};
```

### B. Component Composition Over Creation

#### Reuse Pattern:
```javascript
// BAD: Create FileTypeDisplay.tsx
const FileTypeDisplay = () => { /* new component */ };

// GOOD: Extend existing Badge component
const Badge = ({ variant, children, icon, ...props }) => {
  return (
    <div className={badgeVariants({ variant })} {...props}>
      {icon && <span className="mr-1">{icon}</span>}
      {children}
    </div>
  );
};

// Usage dengan existing component
<Badge icon={<Folder />} variant="secondary">8</Badge>
```

### C. Service Layer Enhancement

#### Extend GoogleDriveService:
```javascript
// Tambah method ke existing service
class GoogleDriveService {
  // existing methods...
  
  // NEW: Add to existing service instead of new file
  async getFileTypeStatistics(files) {
    return this.categorizeFilesByType(files);
  }
  
  categorizeFilesByType(files) {
    // logic untuk file categorization
  }
}
```

## Implementation Guidelines

### 1. Drive Manager Context Specific:
- **File operations**: Extend existing file action handlers
- **UI components**: Reuse shadcn components dengan customization
- **Data fetching**: Add methods ke GoogleDriveService
- **Utils**: Extend existing formatters dan helpers

### 2. Performance Focused:
- **Bundle size**: Reuse imports, avoid duplicate dependencies
- **Memory usage**: Share component instances, avoid recreating
- **Network**: Batch API calls dalam existing service methods

### 3. Maintainability:
- **Single responsibility**: Extend functions dengan clear options
- **Backward compatibility**: Preserve existing API signatures
- **Documentation**: Update existing function docs dengan new capabilities

## Request Templates

### When Asking for New Features:
```
"Implement [feature] dengan:
1. Check existing files dulu untuk reuse opportunities
2. Extend existing functions jika possible  
3. Use composition pattern untuk UI components
4. Add new methods ke existing services
5. Minimize new file creation"
```

### Code Review Criteria:
```
"Sebelum commit, pastikan:
✓ No duplicate logic
✓ Existing functions diextend bukan diganti
✓ Component composition digunakan
✓ Service methods ditambah ke existing class
✓ Utils enhanced dengan backward compatibility"
```

## File Extension Priorities

### High Priority (Always Extend):
- `src/lib/google-drive/utils.ts` - Core utilities
- `src/lib/google-drive/service.ts` - API service methods
- `src/components/ui/` - Shadcn components
- `src/app/(main)/dashboard/drive/_components/drive-manager.tsx` - Main component

### Medium Priority (Consider Extension):
- Custom hooks in `src/hooks/`
- Type definitions in `src/lib/google-drive/types.ts`
- Configuration files

### Low Priority (OK to Create New):
- Page components (`page.tsx`)
- Route handlers (`/api/`)
- Completely different feature domains

## Anti-Patterns to Avoid

### ❌ Don't Create:
- New utility files untuk similar logic
- Duplicate components dengan slight variations
- Separate service classes untuk related functionality
- Multiple files untuk single feature

### ✅ Do Instead:
- Extend existing utilities dengan options
- Compose existing components
- Add methods to existing services
- Consolidate related functionality

## Example: File Type Enhancement

### Optimization Approach:
```javascript
// AVOID: Create new files
// - FileTypeIcons.tsx
// - FileTypeDisplay.tsx  
// - FileTypeUtils.ts

// PREFER: Extend existing
// - utils.ts (add getFileTypeIcon, categorizeFiles)
// - drive-manager.tsx (add displayLogic ke existing component)
// - Badge component (extend dengan icon support)
```

## Maintenance Notes

- Review this guideline regularly saat project berkembang
- Update examples dengan real project cases
- Tambah specific patterns yang ditemukan dalam development
- Document successful optimization cases untuk reference

---

**Last Updated**: June 17, 2025  
**Applies To**: Google Drive Manager Project  
**Review Frequency**: Monthly atau saat major feature additions