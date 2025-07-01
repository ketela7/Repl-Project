#!/usr/bin/env node

/**
 * ESLint Per-File Processing Script
 * Handles ESLint processing file by file to avoid 60-second timeout limitations
 * Focuses on unused imports/variables for fast development workflow
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

// Configuration
const SOURCE_DIR = 'src'
const FILE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx']
const MAX_FILES_PER_BATCH = 5 // Process 5 files at a time to stay under timeout
const ESLINT_RULES_FOCUS = [
  'unused-imports/no-unused-imports',
  'unused-imports/no-unused-vars',
  '@typescript-eslint/no-unused-vars'
]

/**
 * Get all source files recursively
 */
function getSourceFiles(dir, filesList = []) {
  const files = fs.readdirSync(dir)
  
  files.forEach(file => {
    const filePath = path.join(dir, file)
    const stat = fs.statSync(filePath)
    
    if (stat.isDirectory()) {
      // Skip node_modules, .next, and other build directories
      if (!['node_modules', '.next', 'dist', 'build', '.git'].includes(file)) {
        getSourceFiles(filePath, filesList)
      }
    } else if (FILE_EXTENSIONS.some(ext => file.endsWith(ext))) {
      filesList.push(filePath)
    }
  })
  
  return filesList
}

/**
 * Process files in batches to avoid timeouts
 */
function processFilesBatch(files, batchIndex) {
  const startTime = Date.now()
  const batchFiles = files.slice(batchIndex * MAX_FILES_PER_BATCH, (batchIndex + 1) * MAX_FILES_PER_BATCH)
  
  if (batchFiles.length === 0) {
    return { completed: true, totalTime: Date.now() - startTime }
  }
  
  console.log(`\n📋 Processing batch ${batchIndex + 1} (${batchFiles.length} files):`)
  batchFiles.forEach(file => console.log(`   - ${file}`))
  
  let hasErrors = false
  let fixedFiles = 0
  
  batchFiles.forEach(file => {
    try {
      // Check if file has unused imports/variables
      const lintCommand = `npx eslint "${file}" --rule "unused-imports/no-unused-imports: error" --rule "unused-imports/no-unused-vars: error" --rule "@typescript-eslint/no-unused-vars: error" --no-eslintrc --config eslint.config.mjs`
      
      try {
        execSync(lintCommand, { stdio: 'pipe' })
        console.log(`   ✅ ${file} - Clean`)
      } catch (lintError) {
        // File has unused imports/variables, try to fix
        console.log(`   🔧 ${file} - Fixing unused imports/variables...`)
        
        try {
          const fixCommand = `npx eslint "${file}" --fix --rule "unused-imports/no-unused-imports: error" --rule "unused-imports/no-unused-vars: error" --rule "@typescript-eslint/no-unused-vars: error" --no-eslintrc --config eslint.config.mjs`
          execSync(fixCommand, { stdio: 'pipe' })
          
          // Verify fix worked
          execSync(lintCommand, { stdio: 'pipe' })
          console.log(`   ✅ ${file} - Fixed successfully`)
          fixedFiles++
        } catch (fixError) {
          console.log(`   ⚠️  ${file} - Manual fix required`)
          hasErrors = true
        }
      }
    } catch (error) {
      console.log(`   ❌ ${file} - Error: ${error.message.split('\n')[0]}`)
      hasErrors = true
    }
  })
  
  const batchTime = Date.now() - startTime
  console.log(`\n📊 Batch ${batchIndex + 1} completed in ${batchTime}ms`)
  console.log(`   Fixed: ${fixedFiles}, Errors: ${hasErrors ? 'Yes' : 'No'}`)
  
  return { 
    completed: false, 
    hasErrors, 
    fixedFiles, 
    batchTime,
    totalTime: batchTime 
  }
}

/**
 * Main execution function
 */
function main() {
  const args = process.argv.slice(2)
  const isAutoFix = args.includes('--fix')
  const targetDir = args.find(arg => !arg.startsWith('--')) || SOURCE_DIR
  
  console.log('🚀 ESLint Per-File Processing Script')
  console.log(`📁 Target directory: ${targetDir}`)
  console.log(`🔧 Auto-fix mode: ${isAutoFix ? 'ON' : 'OFF'}`)
  console.log(`⏱️  Batch size: ${MAX_FILES_PER_BATCH} files`)
  
  if (!fs.existsSync(targetDir)) {
    console.error(`❌ Directory ${targetDir} not found`)
    process.exit(1)
  }
  
  const allFiles = getSourceFiles(targetDir)
  console.log(`\n📋 Found ${allFiles.length} source files`)
  
  if (allFiles.length === 0) {
    console.log('✅ No source files to process')
    return
  }
  
  const totalBatches = Math.ceil(allFiles.length / MAX_FILES_PER_BATCH)
  console.log(`📦 Processing in ${totalBatches} batches`)
  
  let totalFixed = 0
  let totalErrors = false
  let totalTime = 0
  
  // Process each batch
  for (let i = 0; i < totalBatches; i++) {
    const result = processFilesBatch(allFiles, i)
    
    if (result.completed) break
    
    totalFixed += result.fixedFiles || 0
    totalErrors = totalErrors || result.hasErrors
    totalTime += result.batchTime || 0
    
    // Add small delay between batches to prevent system overload
    if (i < totalBatches - 1) {
      console.log('⏳ Brief pause between batches...')
      execSync('sleep 1')
    }
  }
  
  // Summary
  console.log('\n🎯 Processing Complete!')
  console.log(`📊 Summary:`)
  console.log(`   Total files: ${allFiles.length}`)
  console.log(`   Files fixed: ${totalFixed}`)
  console.log(`   Has errors: ${totalErrors ? 'Yes' : 'No'}`)
  console.log(`   Total time: ${totalTime}ms`)
  
  if (totalErrors) {
    console.log('\n⚠️  Some files require manual attention')
    process.exit(1)
  } else {
    console.log('\n✅ All files processed successfully!')
  }
}

// Execute if run directly
if (require.main === module) {
  main()
}

module.exports = { getSourceFiles, processFilesBatch }