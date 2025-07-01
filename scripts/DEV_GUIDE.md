# 🛠️ Google Drive Pro - Development Quick Reference

## Essential Commands

### Daily Development
```bash
npm run dev              # Start development server
npm run check:quick      # Quick type & lint check
npm run fix:quick        # Auto-fix common issues  
npm run clean            # Clean unused imports
```

### Code Quality
```bash
npm run lint:fix         # Fix linting issues
npm run format           # Format code with Prettier
npm run check:all        # Full code quality check
npm run fix:all          # Fix all auto-fixable issues
```

### Build & Deploy
```bash
npm run build:check      # Full check + build test
npm run build            # Production build
```

### Development Tools
```bash
node scripts/dev-tools.js help     # Show all dev tools
node scripts/dev-tools.js clean    # Clean unused imports
node scripts/dev-tools.js check    # Quick code check
node scripts/dev-tools.js fix      # Auto-fix issues
node scripts/dev-tools.js build    # Test build
node scripts/dev-tools.js deps     # Analyze dependencies
node scripts/dev-tools.js reset    # Reset project
```

## Workflows

### Pre-commit Workflow
```bash
npm run fix:all && npm run check:all
```

### Deployment Preparation
```bash
npm run clean && npm run fix:all && npm run build:check
```

### Troubleshooting
```bash
npm run project:reset    # Clean reset
npm run clean           # Clean imports
npm run fix:quick       # Quick fixes
```

## File Structure
- `scripts/dev-tools.js` - Main development utilities
- `scripts/DEV_GUIDE.md` - This quick reference
- Removed redundant scripts for cleaner structure
