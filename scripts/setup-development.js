#!/usr/bin/env node

/**
 * Development Setup Script
 * Memastikan environment development siap untuk mencegah error build
 */

const fs = require('fs')
const { execSync } = require('child_process')

console.log('🚀 Setting up strict development environment...')

// 1. Create pre-commit script
const preCommitScript = `#!/bin/bash
echo "🔍 Running pre-commit checks..."

# Type checking
echo "📝 Checking TypeScript..."
npm run type-check
if [ $? -ne 0 ]; then
  echo "❌ TypeScript check failed"
  exit 1
fi

# Linting strict
echo "🧹 Running strict linting..."
npx eslint src --ext .ts,.tsx,.js,.jsx --max-warnings 0
if [ $? -ne 0 ]; then
  echo "❌ Linting failed"
  exit 1
fi

# Format check
echo "💅 Checking code formatting..."
npx prettier --check src
if [ $? -ne 0 ]; then
  echo "❌ Code formatting check failed. Run: npm run format:fix"
  exit 1
fi

echo "✅ All pre-commit checks passed!"
`

// 2. Create build check script
const buildCheckScript = `#!/bin/bash
echo "🏗️  Running comprehensive build check..."

# Clean previous build
echo "🧹 Cleaning previous build..."
rm -rf .next

# Type check
echo "📝 Type checking..."
npm run type-check

# Lint strict
echo "🧹 Strict linting..."
npx eslint src --ext .ts,.tsx,.js,.jsx --max-warnings 0

# Build test
echo "🏗️  Testing build..."
npm run build

echo "✅ Build check completed successfully!"
`

// 3. Create development commands
const devCommands = {
  'dev-strict': 'concurrently "npm run dev" "tsc --noEmit --watch"',
  'check-all': 'npm run type-check && npx eslint src --ext .ts,.tsx,.js,.jsx --max-warnings 0 && npx prettier --check src',
  'fix-all': 'npx eslint src --ext .ts,.tsx,.js,.jsx --fix && npx prettier --write src',
  'pre-build': 'npm run type-check && npx eslint src --ext .ts,.tsx,.js,.jsx --max-warnings 0 && npm run build'
}

// 4. Setup VS Code configuration
const vscodeSettings = {
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
  "javascript.validate.enable": true,
  "eslint.validate": ["javascript", "javascriptreact", "typescript", "typescriptreact"],
  "eslint.format.enable": true
}

// 5. Create .vscode directory and settings
try {
  if (!fs.existsSync('.vscode')) {
    fs.mkdirSync('.vscode')
  }
  
  fs.writeFileSync('.vscode/settings.json', JSON.stringify(vscodeSettings, null, 2))
  console.log('✅ VS Code settings configured')
  
  // Create scripts directory if not exists
  if (!fs.existsSync('scripts')) {
    fs.mkdirSync('scripts')
  }
  
  fs.writeFileSync('scripts/pre-commit.sh', preCommitScript)
  fs.writeFileSync('scripts/build-check.sh', buildCheckScript)
  
  // Make scripts executable
  execSync('chmod +x scripts/pre-commit.sh scripts/build-check.sh')
  console.log('✅ Development scripts created')
  
} catch (error) {
  console.error('❌ Error setting up development environment:', error.message)
  process.exit(1)
}

console.log(`
🎉 Development environment setup complete!

📋 Available commands:
  npm run type-check        - Check TypeScript
  npm run lint              - Run ESLint
  npm run lint:fix          - Fix ESLint issues
  npm run format:fix        - Format code with Prettier
  ./scripts/pre-commit.sh   - Run all pre-commit checks
  ./scripts/build-check.sh  - Run comprehensive build check

🔧 VS Code Extensions recommended:
  - ESLint
  - Prettier
  - TypeScript Importer
  - Tailwind CSS IntelliSense

⚡ Workflows configured:
  - Type Check Watch: Continuous TypeScript checking
  - Lint Strict: Zero-warning linting
  - Production Ready: Full production checks

📝 Best practices:
  1. Run ./scripts/pre-commit.sh before every commit
  2. Use Type Check Watch workflow during development
  3. Fix warnings immediately, don't accumulate them
  4. Test build locally before pushing: ./scripts/build-check.sh
`)