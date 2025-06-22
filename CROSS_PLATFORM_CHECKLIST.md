# Cross-Platform Implementation Checklist

## Before Starting Any UI Feature

### 1. Planning Phase
- [ ] Identify if the feature requires modal/dialog interface
- [ ] Plan both desktop and mobile user experiences
- [ ] Consider touch vs mouse interactions
- [ ] Plan responsive layouts and spacing

### 2. Implementation Requirements
- [ ] Import both `Dialog` and `BottomSheet` components
- [ ] Use `useIsMobile()` hook for device detection
- [ ] Implement conditional rendering for both interfaces
- [ ] Ensure feature parity between desktop and mobile

### 3. Desktop Implementation Checklist
- [ ] Dialog component properly configured
- [ ] Dropdown menus for complex actions
- [ ] Proper keyboard navigation support
- [ ] Adequate spacing for mouse interactions
- [ ] Tooltip support where appropriate

### 4. Mobile Implementation Checklist
- [ ] BottomSheet component properly configured
- [ ] Grid layouts for action buttons (2x2 recommended)
- [ ] Touch-friendly button sizes (min 44px)
- [ ] Simplified navigation patterns
- [ ] Optimized for thumb navigation
- [ ] Proper scrolling in content areas

### 5. Feature Parity Verification
- [ ] All actions available on both platforms
- [ ] Same data processing capabilities
- [ ] Consistent success/error handling
- [ ] Identical export options (if applicable)
- [ ] Same validation rules

### 6. Testing Checklist
- [ ] Test desktop interface in browser
- [ ] Test mobile interface in browser developer tools
- [ ] Verify responsive breakpoints
- [ ] Test touch interactions on actual mobile device
- [ ] Verify keyboard navigation (desktop)
- [ ] Test accessibility features

### 7. Code Quality Checklist
- [ ] Shared logic extracted to common functions
- [ ] TypeScript interfaces properly defined
- [ ] Error handling consistent across platforms
- [ ] Loading states implemented for both
- [ ] Proper cleanup on component unmount

## Common Components Requiring Dual Implementation

### Bulk Operations
- [x] Bulk Share Dialog ✅ (Desktop + Mobile)
- [x] Bulk Export Dialog ✅ (Desktop + Mobile)
- [x] Bulk Rename Dialog ✅ (Desktop + Mobile)
- [ ] Bulk Move Dialog (Verify both implementations)
- [ ] Bulk Delete Dialog (Verify both implementations)

### File Operations
- [ ] File Share Dialog (Verify both implementations)
- [ ] File Details Dialog (Verify both implementations)
- [ ] File Upload Dialog (Verify both implementations)
- [ ] Create Folder Dialog (Verify both implementations)

### Filters and Search
- [ ] Advanced Filters Dialog (Verify both implementations)
- [ ] Search Options (Verify both implementations)

## Mobile-Specific UI Patterns

### Button Layouts
```typescript
// ✅ Mobile: Grid layout for actions
<div className="grid grid-cols-2 gap-2">
  <Button>Action 1</Button>
  <Button>Action 2</Button>
  <Button>Action 3</Button>
  <Button>Action 4</Button>
</div>

// ✅ Desktop: Dropdown menu
<DropdownMenu>
  <DropdownMenuItem>Action 1</DropdownMenuItem>
  <DropdownMenuItem>Action 2</DropdownMenuItem>
</DropdownMenu>
```

### Content Scrolling
```typescript
// ✅ Mobile: Limited height with scroll
<div className="max-h-48 overflow-y-auto">
  {results.map(item => ...)}
</div>

// ✅ Desktop: Flexible height
<div className="max-h-64 overflow-y-auto">
  {results.map(item => ...)}
</div>
```

## Verification Commands

```bash
# Check for Dialog implementations
grep -r "Dialog" src/app --include="*.tsx" | grep -v "BottomSheet"

# Check for BottomSheet implementations  
grep -r "BottomSheet" src/app --include="*.tsx"

# Check for useIsMobile usage
grep -r "useIsMobile" src/app --include="*.tsx"

# Find components missing dual implementation
grep -r "Dialog" src/app --include="*.tsx" | grep -v "useIsMobile"
```

## Development Workflow

1. **Design Phase**: Plan both desktop and mobile UX
2. **Implementation**: Start with shared logic and data handling
3. **Desktop UI**: Implement Dialog-based interface
4. **Mobile UI**: Implement BottomSheet-based interface
5. **Testing**: Verify both implementations work correctly
6. **Documentation**: Update this checklist if needed

Remember: **Every modal/dialog feature requires both desktop and mobile implementations!**