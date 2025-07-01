#!/usr/bin/env node
/**
 * Consolidated Development Tools for Google Drive Pro
 * Single script with multiple commands for easy development
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const commands = {
  'clean': 'Clean unused imports and fix code issues',
  'check': 'Run type checking and linting',
  'fix': 'Auto-fix all fixable issues',
  'build': 'Test production build',
  'deps': 'Analyze dependencies',
  'reset': 'Reset and clean project',
  'help': 'Show this help'
}

function showHelp() {
  console.log('🛠️  Google Drive Pro Development Tools\n')
  console.log('Usage: node scripts/dev-tools.js <command>\n')
  console.log('Available commands:')
  Object.entries(commands).forEach(([cmd, desc]) => {
    console.log(`  ${cmd.padEnd(8)} - ${desc}`)
  })
  console.log()
}

function runCommand(cmd, timeout = 30000) {
  try {
    return execSync(cmd, { 
      stdio: 'inherit', 
      timeout,
      encoding: 'utf8' 
    })
  } catch (error) {
    if (error.code === 'TIMEOUT') {
      console.log(`⚠️  Command timed out: ${cmd}`)
      return false
    }
    throw error
  }
}

function cleanUnusedImports() {
  console.log('🧹 Cleaning unused imports with individual ESLint...')
  
  // Individual file processing (user preference for better performance)
  const targetFiles = [
    'src/app/page.tsx',
    'src/app/layout.tsx', 
    'src/components/file-icon.tsx',
    'src/lib/utils.ts',
    'src/auth.ts'
  ]
  
  let cleaned = 0
  for (const file of targetFiles) {
    if (fs.existsSync(file)) {
      try {
        // Individual ESLint command (FASTEST approach)
        runCommand(`npx eslint "${file}" --fix --quiet --max-warnings 0`, 8000)
        console.log(`✅ Cleaned: ${path.basename(file)}`)
        cleaned++
      } catch (error) {
        // Try unused imports only rule as fallback
        try {
          runCommand(`npx eslint "${file}" --fix --quiet --rule "unused-imports/no-unused-imports: error"`, 5000)
          console.log(`✅ Cleaned: ${path.basename(file)} (imports only)`)
          cleaned++
        } catch (e) {
          console.log(`⚠️  ${path.basename(file)} - may need manual review`)
        }
      }
    }
  }
  
  // Manual cleanup for critical files as fallback
  const criticalFiles = [
    'src/app/(main)/dashboard/drive/_components/drive-data-view.tsx',
    'src/app/(main)/dashboard/drive/_components/drive-manager.tsx'
  ]
  
  criticalFiles.forEach(file => {
    if (!fs.existsSync(file)) return
    
    let content = fs.readFileSync(file, 'utf8')
    const original = content
    
    // Remove common unused imports
    const unusedPatterns = [
      /,\s*ChevronUp/g,
      /,\s*ChevronDown/g, 
      /,\s*ChevronsUpDown/g,
      /,\s*Triangle/g,
      /ChevronUp\s*,/g,
      /ChevronDown\s*,/g,
      /ChevronsUpDown\s*,/g,
      /Triangle\s*,/g
    ]
    
    unusedPatterns.forEach(pattern => {
      content = content.replace(pattern, '')
    })
    
    // Clean empty imports
    content = content.replace(/import\s*{\s*}\s*from[^;]+;?\s*/g, '')
    content = content.replace(/\n\n\n+/g, '\n\n')
    
    if (content !== original) {
      fs.writeFileSync(file, content)
      console.log(`✅ Cleaned: ${path.basename(file)}`)
    }
  })
}

function checkCode() {
  console.log('🔍 Running code checks...')
  
  console.log('\n📝 Type checking...')
  runCommand('npx tsc --noEmit --skipLibCheck', 15000)
  
  console.log('\n🔧 Linting (auto-fix)...')
  runCommand('npx eslint src --ext .ts,.tsx --fix --quiet --max-warnings 10', 20000)
  
  console.log('\n✅ Code checks complete')
}

function testBuild() {
  console.log('🏗️  Testing production build...')
  
  // Clean .next first
  if (fs.existsSync('.next')) {
    runCommand('rm -rf .next')
  }
  
  runCommand('npm run build', 60000)
  console.log('✅ Build test complete')
}

function analyzeDeps() {
  console.log('📦 Analyzing dependencies...')
  
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))
  const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies }
  
  console.log(`Total dependencies: ${Object.keys(allDeps).length}`)
  
  // Check for obvious unused packages
  const potentiallyUnused = [
    'axios', 'lodash', 'moment', 'recharts', 'uuid'
  ].filter(pkg => allDeps[pkg])
  
  if (potentiallyUnused.length > 0) {
    console.log('⚠️  Potentially unused:', potentiallyUnused.join(', '))
  }
}

function resetProject() {
  console.log('🔄 Resetting project...')
  
  const dirsToClean = ['.next', 'node_modules/.cache', 'dist']
  
  dirsToClean.forEach(dir => {
    if (fs.existsSync(dir)) {
      console.log(`Cleaning ${dir}...`)
      runCommand(`rm -rf ${dir}`)
    }
  })
  
  console.log('Installing dependencies...')
  runCommand('npm install')
  
  console.log('✅ Project reset complete')
}

function fixAll() {
  console.log('🔧 Auto-fixing all issues...')
  
  cleanUnusedImports()
  
  console.log('\n🔧 Running ESLint fixes...')
  runCommand('npx eslint src --ext .ts,.tsx --fix --quiet', 25000)
  
  console.log('\n💅 Formatting code...')
  runCommand('npx prettier --write "src/**/*.{ts,tsx,js,jsx}" --loglevel silent', 15000)
  
  console.log('\n✅ All fixes applied')
}

// Main execution
const command = process.argv[2]

if (!command || command === 'help') {
  showHelp()
  process.exit(0)
}

if (!commands[command]) {
  console.log(`❌ Unknown command: ${command}`)
  showHelp()
  process.exit(1)
}

console.log(`🚀 Running: ${command}\n`)

try {
  switch (command) {
    case 'clean':
      cleanUnusedImports()
      break
    case 'check':
      checkCode()
      break
    case 'fix':
      fixAll()
      break
    case 'build':
      testBuild()
      break
    case 'deps':
      analyzeDeps()
      break
    case 'reset':
      resetProject()
      break
    default:
      showHelp()
  }
  
  console.log('\n🎉 Command completed successfully!')
} catch (error) {
  console.log(`\n❌ Command failed: ${error.message}`)
  process.exit(1)
}