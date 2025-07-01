# 🔧 Optimized Workflow Configuration

## Recommended Replit Workflows

### Essential (Always Running)
- **Server**: `npm run dev` (port 5000)

### On-Demand (Run when needed)
- **Quick Check**: `npm run lint:fix --silent`
- **Type Check**: `npx tsc --noEmit --skipLibCheck`  
- **Code Format**: `npm run format --silent`

## Development Commands

### Daily Use
```bash
# Quick development cycle
npm run dev              # Start server
node scripts/dev-tools.js clean    # Clean imports
npm run lint:fix         # Fix linting
```

### Before Committing
```bash
node scripts/dev-tools.js fix      # Auto-fix issues
npm run type-check       # Check types
npm run format           # Format code
```

### Troubleshooting
```bash
node scripts/dev-tools.js reset    # Full reset
node scripts/dev-tools.js clean    # Clean imports
```

## Performance Tips
1. Use individual file ESLint: `npx eslint [file] --fix`
2. Skip library checks: `--skipLibCheck` for faster TypeScript
3. Use `--silent` flag to reduce output noise
4. Run type checks on-demand instead of continuous watch
