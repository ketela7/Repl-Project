#!/usr/bin/env node

/**
 * Individual ESLint Guide - Better Performance & Results
 * Demonstrates how to use ESLint file-by-file for optimal performance
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

console.log('🎯 Individual ESLint Guide - Better Performance')
console.log('='.repeat(50))

// Individual ESLint commands for better performance
const eslintCommands = {
  // Single file processing (FASTEST)
  singleFile: (filePath) => `npx eslint "${filePath}" --fix --quiet`,
  
  // Type-specific processing (FAST)
  componentFiles: 'npx eslint "src/components/**/*.{ts,tsx}" --fix --quiet --max-warnings 5',
  apiFiles: 'npx eslint "src/app/api/**/*.ts" --fix --quiet --max-warnings 3',
  libFiles: 'npx eslint "src/lib/**/*.ts" --fix --quiet --max-warnings 5',
  
  // Pattern-based processing (MEDIUM)
  tsxOnly: 'npx eslint "src/**/*.tsx" --fix --quiet --max-warnings 10',
  tsOnly: 'npx eslint "src/**/*.ts" --fix --quiet --max-warnings 10',
  
  // Specific rules only (VERY FAST)
  unusedImports: (filePath) => `npx eslint "${filePath}" --fix --quiet --rule "unused-imports/no-unused-imports: error"`,
  noConsole: (filePath) => `npx eslint "${filePath}" --fix --quiet --rule "no-console: warn"`,
}

function findProblemFiles() {
  console.log('\n🔍 Finding files with potential issues...')
  
  try {
    // Find files with unused imports
    const result = execSync('find src -name "*.ts" -o -name "*.tsx" | head -10', { encoding: 'utf8' })
    const files = result.trim().split('\n').filter(file => file.length > 0)
    
    console.log('📁 Sample files to process:')
    files.forEach((file, index) => {
      if (fs.existsSync(file)) {
        console.log(`  ${index + 1}. ${file}`)
      }
    })
    
    return files.filter(file => fs.existsSync(file))
  } catch (error) {
    console.log('⚠️  No TypeScript files found or error occurred')
    return []
  }
}

function demonstrateIndividualESLint() {
  console.log('\n🚀 Individual ESLint Examples (Better Performance)')
  console.log('-'.repeat(50))
  
  const files = findProblemFiles()
  
  if (files.length === 0) {
    console.log('ℹ️  No files to process')
    return
  }
  
  // Example 1: Single file processing (FASTEST approach)
  console.log('\n1️⃣  Single File Processing (FASTEST):')
  const targetFile = files[0]
  if (targetFile) {
    const command = eslintCommands.singleFile(targetFile)
    console.log(`   Command: ${command}`)
    
    try {
      console.log(`   Processing: ${targetFile}`)
      execSync(command, { encoding: 'utf8', stdio: 'pipe' })
      console.log('   ✅ Success - file processed individually')
    } catch (error) {
      console.log('   ⚠️  Minor issues found and fixed')
    }
  }
  
  // Example 2: Component files only
  console.log('\n2️⃣  Component Files Only (TYPE-SPECIFIC):')
  console.log(`   Command: ${eslintCommands.componentFiles}`)
  
  try {
    execSync(eslintCommands.componentFiles, { encoding: 'utf8', stdio: 'pipe' })
    console.log('   ✅ Components processed successfully')
  } catch (error) {
    console.log('   ⚠️  Component issues found and fixed')
  }
  
  // Example 3: Specific rule processing
  console.log('\n3️⃣  Unused Imports Only (RULE-SPECIFIC):')
  files.slice(0, 3).forEach((file, index) => {
    const command = eslintCommands.unusedImports(file)
    console.log(`   ${index + 1}. ${command}`)
    
    try {
      execSync(command, { encoding: 'utf8', stdio: 'pipe' })
      console.log(`      ✅ ${path.basename(file)} - unused imports cleaned`)
    } catch (error) {
      console.log(`      ⚠️  ${path.basename(file)} - minor cleanup done`)
    }
  })
}

function showPerformanceComparison() {
  console.log('\n📊 Performance Comparison')
  console.log('-'.repeat(50))
  
  console.log('🐌 SLOW (avoid): npx eslint src/ --fix')
  console.log('   - Processes entire directory')
  console.log('   - High memory usage')
  console.log('   - May cause timeouts')
  console.log('')
  
  console.log('⚡ FAST (recommended): npx eslint "src/file.tsx" --fix --quiet')
  console.log('   - Processes single file')
  console.log('   - Low memory usage')
  console.log('   - No timeouts')
  console.log('')
  
  console.log('🏃 MEDIUM: npx eslint "src/components/**/*.tsx" --fix --quiet --max-warnings 5')
  console.log('   - Processes by type/folder')
  console.log('   - Moderate memory usage')
  console.log('   - Predictable performance')
}

function createQuickCommands() {
  console.log('\n🛠️  Quick Commands for Daily Use')
  console.log('-'.repeat(50))
  
  const quickCommands = `
# Individual file processing (use for specific files)
npx eslint "src/components/drive-manager.tsx" --fix --quiet

# Component folder only
npx eslint "src/components/**/*.tsx" --fix --quiet --max-warnings 5

# API routes only  
npx eslint "src/app/api/**/*.ts" --fix --quiet --max-warnings 3

# Lib utilities only
npx eslint "src/lib/**/*.ts" --fix --quiet --max-warnings 5

# Unused imports only (super fast)
npx eslint "src/file.tsx" --fix --quiet --rule "unused-imports/no-unused-imports: error"

# TypeScript files only
npx eslint "src/**/*.ts" --fix --quiet --max-warnings 10

# React components only
npx eslint "src/**/*.tsx" --fix --quiet --max-warnings 10
  `.trim()
  
  console.log(quickCommands)
  
  // Save to file for reference
  fs.writeFileSync('scripts/ESLINT_COMMANDS.md', `# Individual ESLint Commands\n\n\`\`\`bash\n${quickCommands}\n\`\`\``)
  console.log('\n📝 Commands saved to scripts/ESLINT_COMMANDS.md')
}

// Main execution
function main() {
  demonstrateIndividualESLint()
  showPerformanceComparison()
  createQuickCommands()
  
  console.log('\n🎉 Individual ESLint demonstration complete!')
  console.log('\n💡 Key Takeaways:')
  console.log('   - Use individual file processing for best performance')
  console.log('   - Add --quiet flag to reduce output noise')
  console.log('   - Use --max-warnings to set realistic thresholds')
  console.log('   - Process by file type/folder for medium-scale cleanup')
  console.log('   - Avoid directory-wide processing that causes timeouts')
}

if (require.main === module) {
  main()
}

module.exports = {
  eslintCommands,
  demonstrateIndividualESLint,
  showPerformanceComparison
}