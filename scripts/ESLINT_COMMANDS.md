# Individual ESLint Commands for Better Performance

## 🚀 FASTEST - Single File Processing

```bash
# Process one file at a time (recommended)
npx eslint "src/app/page.tsx" --fix --quiet
npx eslint "src/components/file-icon.tsx" --fix --quiet
npx eslint "src/lib/utils.ts" --fix --quiet

# Unused imports only (super fast)
npx eslint "src/app/page.tsx" --fix --quiet --rule "unused-imports/no-unused-imports: error"
```

## ⚡ FAST - Type-Specific Processing

```bash
# Components only
npx eslint "src/components/**/*.tsx" --fix --quiet --max-warnings 5

# API routes only
npx eslint "src/app/api/**/*.ts" --fix --quiet --max-warnings 3

# Lib utilities only
npx eslint "src/lib/**/*.ts" --fix --quiet --max-warnings 5

# TypeScript files only
npx eslint "src/**/*.ts" --fix --quiet --max-warnings 10

# React components only
npx eslint "src/**/*.tsx" --fix --quiet --max-warnings 10
```

## 🏃 MEDIUM - Folder-Specific Processing

```bash
# Authentication components
npx eslint "src/app/(main)/auth/**/*.tsx" --fix --quiet

# Dashboard components
npx eslint "src/app/(main)/dashboard/**/*.tsx" --fix --quiet

# Drive components
npx eslint "src/app/(main)/dashboard/drive/**/*.tsx" --fix --quiet
```

## 🎯 Rule-Specific Processing

```bash
# Only fix unused imports
npx eslint "src/file.tsx" --fix --quiet --rule "unused-imports/no-unused-imports: error"

# Only fix console warnings
npx eslint "src/file.tsx" --fix --quiet --rule "no-console: warn"

# Only fix TypeScript issues
npx eslint "src/file.tsx" --fix --quiet --rule "@typescript-eslint/no-unused-vars: error"
```

## 🐌 AVOID - These Commands Are Too Slow

```bash
# DON'T: Process entire src directory
npx eslint src/ --fix

# DON'T: Process without limits
npx eslint "src/**/*" --fix

# DON'T: Run without --quiet flag
npx eslint "src/**/*.tsx" --fix
```

## 💡 Daily Workflow

```bash
# 1. Clean specific file you're working on
npx eslint "src/components/drive-manager.tsx" --fix --quiet

# 2. Clean by component type when needed
npx eslint "src/components/**/*.tsx" --fix --quiet --max-warnings 5

# 3. Clean API routes after changes
npx eslint "src/app/api/**/*.ts" --fix --quiet --max-warnings 3

# 4. Quick unused imports cleanup
npx eslint "src/lib/utils.ts" --fix --quiet --rule "unused-imports/no-unused-imports: error"
```

## ⚙️ Performance Tips

1. **Always use `--quiet`** to reduce output noise
2. **Use `--max-warnings X`** to set realistic limits
3. **Process one file at a time** for best performance
4. **Target specific folders** instead of entire src
5. **Use specific rules** when you know the issue type
6. **Avoid directory-wide processing** that causes timeouts

## 🔧 Integration with dev-tools.js

```bash
# Use our optimized tool for automated cleanup
node scripts/dev-tools.js clean
```

This uses individual file processing internally for better performance.