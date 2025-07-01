# Vercel Deployment Guide - Google Drive Pro

## Quick Start

```bash
# Fix all Vercel build issues automatically
node scripts/vercel-build-fix.js

# Or use the Vercel Ready workflow
# (configured in workflows)
```

## Common Build Issues & Solutions

### 1. exactOptionalPropertyTypes Error

**Problem**: TypeScript `exactOptionalPropertyTypes: true` requires exact optional property types.

```
Type 'string | undefined' is not assignable to type 'string'
```

**Solution**: Use conditional property spreading:

```tsx
// ❌ Wrong - passes undefined
<Component thumbnailLink={item.thumbnailLink} />

// ✅ Correct - only passes if defined  
<Component {...(item.thumbnailLink && { thumbnailLink: item.thumbnailLink })} />
```

### 2. Missing Environment Variables

**Required Variables for Production**:
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret  
- `NEXTAUTH_SECRET` - NextAuth.js secret key
- `NEXTAUTH_URL` - Production URL (e.g., https://your-app.vercel.app)

**Setup in Vercel**:
1. Go to Vercel dashboard → Project Settings → Environment Variables
2. Add each variable with production values
3. Redeploy the application

### 3. TypeScript Compilation Errors

**Common fixes**:
- Run `npx eslint src --fix` for auto-fixable issues
- Check for unused imports and variables
- Ensure all interfaces are properly defined
- Verify component prop types match usage

### 4. Build Performance Issues

**Optimization strategies**:
- Use `--skipLibCheck` for faster builds
- Enable incremental compilation in `tsconfig.json`
- Lazy load heavy components
- Optimize bundle splitting

## Automated Build Tool

The `scripts/vercel-build-fix.js` tool handles:

- ✅ exactOptionalPropertyTypes fixes
- ✅ Environment variable validation  
- ✅ ESLint auto-fix
- ✅ TypeScript compilation check
- ✅ Production build test
- ✅ Comprehensive deployment report

### Tool Commands

```bash
# Full check and fix (recommended)
node scripts/vercel-build-fix.js

# Specific operations
node scripts/vercel-build-fix.js fix-types    # Fix TypeScript issues
node scripts/vercel-build-fix.js check-env   # Check environment variables
node scripts/vercel-build-fix.js test-build  # Test production build
```

## Pre-Deployment Checklist

### Local Development
- [ ] All TypeScript errors resolved
- [ ] ESLint passes with minimal warnings
- [ ] Production build succeeds locally
- [ ] Environment variables configured

### Vercel Configuration
- [ ] Environment variables set in Vercel dashboard
- [ ] Build command: `npm run build` 
- [ ] Output directory: `.next`
- [ ] Node.js version: 18.x or higher

### Post-Deployment
- [ ] Application loads correctly
- [ ] Google OAuth authentication works
- [ ] File operations function properly
- [ ] Mobile responsiveness verified

## Troubleshooting

### Build Fails with TypeScript Errors

1. Run the build fix tool:
   ```bash
   node scripts/vercel-build-fix.js
   ```

2. Check specific error patterns:
   ```bash
   npx tsc --noEmit --skipLibCheck
   ```

3. Fix individual files:
   ```bash
   npx eslint "src/specific-file.tsx" --fix
   ```

### Authentication Issues

1. Verify environment variables in Vercel dashboard
2. Check NEXTAUTH_URL matches your domain
3. Ensure Google OAuth callback URLs are configured

### Performance Issues

1. Enable analytics in Vercel dashboard
2. Check bundle size with `npm run build:analyze`
3. Review Core Web Vitals metrics
4. Optimize images and lazy loading

## Development Workflow

### Before Each Deployment

```bash
# 1. Run full check
node scripts/vercel-build-fix.js

# 2. Test build locally
npm run build

# 3. Commit and push changes
git add .
git commit -m "Fix build issues for Vercel deployment"
git push
```

### Continuous Integration

The project includes automated checks for:
- TypeScript compilation
- ESLint validation  
- Production build testing
- Environment variable validation

## Best Practices

### Code Quality
- Use TypeScript strict mode
- Follow exactOptionalPropertyTypes guidelines
- Implement proper error boundaries
- Maintain consistent coding standards

### Performance
- Optimize bundle size regularly
- Use proper caching strategies
- Implement lazy loading for heavy components
- Monitor Core Web Vitals

### Security
- Never expose sensitive data in client-side code
- Use environment variables for all secrets
- Implement proper authentication flows
- Regular security updates

---

**Last Updated**: July 1, 2025  
**Version**: 1.0  
**Tool**: `scripts/vercel-build-fix.js`