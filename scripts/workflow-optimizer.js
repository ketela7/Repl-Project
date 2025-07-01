#!/usr/bin/env node
/**
 * Workflow Optimizer - Streamlines development workflows
 */

const fs = require('fs')
const { execSync } = require('child_process')

console.log('⚙️  Optimizing development workflows...\n')

// Optimized package.json scripts
const optimizedScripts = {
  // Core development
  "dev": "next dev --turbo -p 5000 -H 0.0.0.0",
  "build": "next build",
  "start": "next start -p 5000",
  
  // Quick checks (fast, for frequent use)
  "check:quick": "node scripts/dev-tools.js check",
  "fix:quick": "node scripts/dev-tools.js fix",
  "clean": "node scripts/dev-tools.js clean",
  
  // Comprehensive checks (slower, for CI/pre-commit)
  "type-check": "tsc --noEmit",
  "lint": "eslint src --ext .ts,.tsx,.js,.jsx --max-warnings 5",
  "lint:fix": "eslint src --ext .ts,.tsx,.js,.jsx --fix --max-warnings 5",
  "format": "prettier --write \"src/**/*.{ts,tsx,js,jsx,json,css,md}\"",
  "format:check": "prettier --check \"src/**/*.{ts,tsx,js,jsx,json,css,md}\"",
  
  // Combined workflows
  "check:all": "npm run type-check && npm run lint && npm run format:check",
  "fix:all": "npm run lint:fix && npm run format",
  "build:check": "npm run check:all && npm run build",
  
  // Development tools
  "deps:analyze": "node scripts/dev-tools.js deps",
  "project:reset": "node scripts/dev-tools.js reset",
  
  // Testing
  "test": "jest",
  "test:watch": "jest --watch",
  "test:coverage": "jest --coverage"
}

// Update package.json scripts
function updatePackageJson() {
  const packagePath = 'package.json'
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'))
  
  packageJson.scripts = {
    ...packageJson.scripts,
    ...optimizedScripts
  }
  
  fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n')
  console.log('✅ Updated package.json scripts')
}

// Create development commands quick reference
function createQuickReference() {
  const quickRef = `# 🛠️ Google Drive Pro - Development Quick Reference

## Essential Commands

### Daily Development
\`\`\`bash
npm run dev              # Start development server
npm run check:quick      # Quick type & lint check
npm run fix:quick        # Auto-fix common issues  
npm run clean            # Clean unused imports
\`\`\`

### Code Quality
\`\`\`bash
npm run lint:fix         # Fix linting issues
npm run format           # Format code with Prettier
npm run check:all        # Full code quality check
npm run fix:all          # Fix all auto-fixable issues
\`\`\`

### Build & Deploy
\`\`\`bash
npm run build:check      # Full check + build test
npm run build            # Production build
\`\`\`

### Development Tools
\`\`\`bash
node scripts/dev-tools.js help     # Show all dev tools
node scripts/dev-tools.js clean    # Clean unused imports
node scripts/dev-tools.js check    # Quick code check
node scripts/dev-tools.js fix      # Auto-fix issues
node scripts/dev-tools.js build    # Test build
node scripts/dev-tools.js deps     # Analyze dependencies
node scripts/dev-tools.js reset    # Reset project
\`\`\`

## Workflows

### Pre-commit Workflow
\`\`\`bash
npm run fix:all && npm run check:all
\`\`\`

### Deployment Preparation
\`\`\`bash
npm run clean && npm run fix:all && npm run build:check
\`\`\`

### Troubleshooting
\`\`\`bash
npm run project:reset    # Clean reset
npm run clean           # Clean imports
npm run fix:quick       # Quick fixes
\`\`\`

## File Structure
- \`scripts/dev-tools.js\` - Main development utilities
- \`scripts/DEV_GUIDE.md\` - This quick reference
- Removed redundant scripts for cleaner structure
`

  fs.writeFileSync('scripts/DEV_GUIDE.md', quickRef)
  console.log('✅ Created development quick reference')
}

// Clean up redundant scripts
function cleanupScripts() {
  const redundantScripts = [
    'comprehensive-eslint-cleanup.js',
    'comprehensive-manual-cleanup.js', 
    'eslint-critical-files.js',
    'eslint-file-by-file.js',
    'eslint-unused-cleanup.js',
    'fix-unused-imports.js',
    'manual-unused-fix.js',
    'quick-unused-fix.js',
    'simple-eslint-fix.js',
    'smart-eslint-fix.js',
    'targeted-eslint.js',
    'final-cleanup.js',
    'quick-fix-types.js'
  ]
  
  let removedCount = 0
  redundantScripts.forEach(script => {
    const scriptPath = `scripts/${script}`
    if (fs.existsSync(scriptPath)) {
      fs.unlinkSync(scriptPath)
      removedCount++
    }
  })
  
  console.log(`✅ Removed ${removedCount} redundant scripts`)
}

// Optimize workflows for lighter processing
function optimizeWorkflows() {
  console.log('⚙️  Optimizing Replit workflows...')
  
  // Note: Workflows are managed by Replit, this provides recommendations
  console.log('\n📝 Workflow Optimization Recommendations:')
  console.log('1. Use "npm run check:quick" for frequent checks')
  console.log('2. Use "npm run build:check" only before deployment')
  console.log('3. Individual file ESLint: npx eslint [file] --fix')
  console.log('4. Type checking: npm run type-check (lighter than full build)')
}

// Main execution
updatePackageJson()
createQuickReference()
cleanupScripts()
optimizeWorkflows()

console.log('\n🎉 Workflow optimization complete!')
console.log('\n📖 Next steps:')
console.log('1. Run: npm run check:quick')
console.log('2. Check: scripts/DEV_GUIDE.md')
console.log('3. Use: node scripts/dev-tools.js help')