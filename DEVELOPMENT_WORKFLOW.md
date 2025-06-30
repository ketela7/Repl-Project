# Development Workflow - Mencegah Error Build

## 🔥 Pre-Commit Checklist

### 1. **Type Safety Check**
```bash
# Selalu jalankan sebelum commit
npm run type-check

# Untuk check cepat file spesifik
npx tsc --noEmit src/path/to/file.tsx
```

### 2. **Linting & Code Quality**
```bash
# Fix semua linting errors
npm run lint -- --fix

# Check linting tanpa auto-fix
npm run lint
```

### 3. **Build Test**
```bash
# Test build sebelum push
npm run build

# Atau quick check
npx next build --dry-run
```

## 🛠️ ESLint Configuration Strict

### Setup ESLint Rules Ketat

Mari saya update ESLint config untuk mencegah error build:

```javascript
// .eslintrc.js - Configuration Strict
module.exports = {
  extends: [
    'next/core-web-vitals',
    '@typescript-eslint/recommended',
    '@typescript-eslint/recommended-requiring-type-checking'
  ],
  rules: {
    // Prevent unused variables/imports
    '@typescript-eslint/no-unused-vars': 'error',
    'no-unused-vars': 'off',
    
    // Strict type checking
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/strict-boolean-expressions': 'error',
    
    // Prevent potential runtime errors
    '@typescript-eslint/no-non-null-assertion': 'error',
    '@typescript-eslint/prefer-nullish-coalescing': 'error',
    
    // Import organization
    'import/order': 'error',
    'import/no-unused-modules': 'error',
    
    // React specific
    'react-hooks/exhaustive-deps': 'error',
    'react/prop-types': 'off'
  }
}
```

## 📋 Development Scripts

### Package.json Scripts yang Diperlukan

```json
{
  "scripts": {
    "dev": "next dev --turbo -p 5000 -H 0.0.0.0",
    "build": "next build",
    "build:check": "npm run type-check && npm run lint && npm run build",
    "type-check": "tsc --noEmit",
    "type-check:watch": "tsc --noEmit --watch",
    "lint": "eslint src --ext .ts,.tsx,.js,.jsx",
    "lint:fix": "eslint src --ext .ts,.tsx,.js,.jsx --fix",
    "lint:strict": "eslint src --ext .ts,.tsx,.js,.jsx --max-warnings 0",
    "format": "prettier --write \"src/**/*.{ts,tsx,js,jsx,json,css,md}\"",
    "format:check": "prettier --check \"src/**/*.{ts,tsx,js,jsx,json,css,md}\"",
    "pre-commit": "npm run type-check && npm run lint:strict && npm run format:check",
    "pre-push": "npm run build:check"
  }
}
```

## 🔧 VS Code Configuration

### .vscode/settings.json
```json
{
  "typescript.preferences.useAliasesForRenames": false,
  "typescript.preferences.includePackageJsonAutoImports": "on",
  "typescript.suggest.autoImports": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.organizeImports": true
  },
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "typescript.validate.enable": true,
  "javascript.validate.enable": true
}
```

### .vscode/extensions.json
```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint"
  ]
}
```

## 🚨 TypeScript Configuration Strict

### tsconfig.json Updates
```json
{
  "compilerOptions": {
    "strict": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "allowUnusedLabels": false,
    "allowUnreachableCode": false,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

## 📦 Git Hooks Setup

### Husky Pre-commit Hook
```bash
# Install husky
npm install --save-dev husky lint-staged

# Setup husky
npx husky install
npx husky add .husky/pre-commit "npm run pre-commit"
npx husky add .husky/pre-push "npm run pre-push"
```

### .lintstagedrc.json
```json
{
  "*.{ts,tsx,js,jsx}": [
    "eslint --fix",
    "prettier --write"
  ],
  "*.{json,css,md}": [
    "prettier --write"
  ]
}
```

## 🔍 Daily Development Workflow

### 1. **Sebelum Mulai Coding**
```bash
git pull origin main
npm install
npm run type-check
```

### 2. **Selama Development**
```bash
# Terminal 1: Development server
npm run dev

# Terminal 2: Type checking watch
npm run type-check:watch

# Periodic checks
npm run lint:fix
```

### 3. **Sebelum Commit**
```bash
npm run pre-commit
git add .
git commit -m "feat: description"
```

### 4. **Sebelum Push**
```bash
npm run pre-push
git push origin feature-branch
```

## 🚀 Production Build Checklist

### Final Checks
- [ ] `npm run type-check` - Zero TypeScript errors
- [ ] `npm run lint:strict` - Zero ESLint warnings/errors  
- [ ] `npm run format:check` - Code properly formatted
- [ ] `npm run build` - Successful production build
- [ ] Test critical user flows
- [ ] Check bundle size (`npm run build` output)

## 🛡️ Error Prevention Strategies

### 1. **Import/Export Consistency**
- Always use absolute imports (`@/components/...`)
- Organize imports: external → internal → relative
- Remove unused imports immediately

### 2. **Type Safety**
- Define interfaces for all props
- Use `as const` for literal types
- Avoid `any` type - use `unknown` instead
- Use type guards for runtime type checking

### 3. **Component Props**
- Make optional props explicit with `?:`
- Provide default values in destructuring
- Use `Pick` and `Omit` for type composition

### 4. **Async Operations**
- Always handle Promise rejections
- Use proper typing for async functions
- Implement loading and error states

### 5. **Performance Monitoring**
- Monitor bundle size in CI/CD
- Use `React.memo` for expensive components
- Implement proper code splitting

## 📊 Monitoring & Metrics

### Build Performance
- Track build time trends
- Monitor bundle size changes
- Watch for dependency bloat

### Code Quality Metrics
- TypeScript error count (should be 0)
- ESLint warning count (should be 0)
- Test coverage percentage
- Build success rate

## 🔄 Continuous Integration

### GitHub Actions Example
```yaml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run type-check
      - run: npm run lint:strict
      - run: npm run build
```

## 📝 Code Review Guidelines

### Reviewer Checklist
- [ ] TypeScript types are properly defined
- [ ] No unused imports/variables
- [ ] Error handling implemented
- [ ] Performance considerations addressed
- [ ] Accessibility requirements met
- [ ] Security best practices followed

Dengan mengikuti workflow ini, error build seperti yang Anda alami akan dapat dicegah secara sistematis.