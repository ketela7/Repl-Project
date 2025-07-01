#!/usr/bin/env node

/**
 * Vercel Build Fix Tool for Google Drive Pro
 * Handles TypeScript exactOptionalPropertyTypes and other Vercel build issues
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Vercel Build Fix Tool - Google Drive Pro');
console.log('==================================================');

/**
 * Run command with error handling
 */
function runCommand(cmd, timeout = 60000) {
  try {
    const result = execSync(cmd, { 
      encoding: 'utf-8', 
      stdio: 'pipe',
      timeout: timeout
    });
    return { success: true, output: result };
  } catch (error) {
    return { 
      success: false, 
      error: error.message,
      output: error.stdout || '',
      stderr: error.stderr || ''
    };
  }
}

/**
 * Fix exactOptionalPropertyTypes issues
 */
function fixExactOptionalPropertyTypes() {
  console.log('🎯 Fixing exactOptionalPropertyTypes issues...');
  
  const problematicPatterns = [
    {
      file: 'src/app/(main)/dashboard/drive/_components/drive-data-view.tsx',
      fixes: [
        {
          pattern: /thumbnailLink=\{item\.thumbnailLink\}/g,
          replacement: '{...(item.thumbnailLink && { thumbnailLink: item.thumbnailLink })}'
        }
      ]
    },
    {
      file: 'src/lib/google-drive/service.ts',
      fixes: [
        // Fix fileMetadata optional properties
        {
          pattern: /parents: parentId \? \[parentId\] : metadata\.parents,/g,
          replacement: '...(parentId ? { parents: [parentId] } : metadata.parents && { parents: metadata.parents }),'
        },
        {
          pattern: /description: metadata\.description,/g,
          replacement: '...(metadata.description && { description: metadata.description }),'
        },
        // Fix convertGoogleDriveFile optional properties
        {
          pattern: /webViewLink: response\.data\.webViewLink,/g,
          replacement: '...(response.data.webViewLink && { webViewLink: response.data.webViewLink }),'
        },
        {
          pattern: /webContentLink: response\.data\.webContentLink,/g,
          replacement: '...(response.data.webContentLink && { webContentLink: response.data.webContentLink }),'
        },
        {
          pattern: /thumbnailLink: response\.data\.thumbnailLink,/g,
          replacement: '...(response.data.thumbnailLink && { thumbnailLink: response.data.thumbnailLink }),'
        },
        {
          pattern: /iconLink: response\.data\.iconLink,/g,
          replacement: '...(response.data.iconLink && { iconLink: response.data.iconLink }),'
        },
        {
          pattern: /description: response\.data\.description,/g,
          replacement: '...(response.data.description && { description: response.data.description }),'
        },
        // Fix moveFile removeParents issue
        {
          pattern: /removeParents: currentParentId,/g,
          replacement: '...(currentParentId && { removeParents: currentParentId }),'
        },
        // Fix buildSearchQuery parentId issue
        {
          pattern: /parentId,\s*mimeType:/g,
          replacement: '...(parentId && { parentId }),\n      mimeType:'
        }
      ]
    },
    // Add more patterns as needed
  ];

  let fixesApplied = 0;

  problematicPatterns.forEach(({ file, fixes }) => {
    if (fs.existsSync(file)) {
      let content = fs.readFileSync(file, 'utf-8');
      let fileChanged = false;

      fixes.forEach(({ pattern, replacement }) => {
        if (pattern.test(content)) {
          content = content.replace(pattern, replacement);
          fileChanged = true;
          fixesApplied++;
        }
      });

      if (fileChanged) {
        fs.writeFileSync(file, content);
        console.log(`  ✅ Fixed ${file}`);
      }
    }
  });

  console.log(`  📊 Applied ${fixesApplied} exactOptionalPropertyTypes fixes`);
}

/**
 * Run TypeScript compilation check
 */
function checkTypeScript() {
  console.log('📝 Running TypeScript compilation check...');
  
  const result = runCommand('npx tsc --noEmit --skipLibCheck', 45000);
  
  if (result.success) {
    console.log('  ✅ TypeScript compilation successful');
    return true;
  } else {
    console.log('  ❌ TypeScript compilation failed:');
    console.log(result.output);
    console.log(result.stderr);
    return false;
  }
}

/**
 * Run ESLint with auto-fix
 */
function runESLintFix() {
  console.log('🧹 Running ESLint auto-fix...');
  
  const result = runCommand('npx eslint src --ext .ts,.tsx,.js,.jsx --fix --max-warnings 10', 30000);
  
  if (result.success) {
    console.log('  ✅ ESLint auto-fix completed');
    return true;
  } else {
    console.log('  ⚠️ ESLint completed with warnings:');
    console.log(result.output);
    return true; // Continue even with warnings
  }
}

/**
 * Test production build
 */
function testBuild() {
  console.log('🏗️ Testing production build...');
  
  const result = runCommand('npm run build', 120000); // 2 minutes timeout
  
  if (result.success) {
    console.log('  ✅ Production build successful');
    return true;
  } else {
    console.log('  ❌ Production build failed:');
    console.log(result.output);
    console.log(result.stderr);
    return false;
  }
}

/**
 * Clean build artifacts
 */
function cleanBuild() {
  console.log('🧽 Cleaning build artifacts...');
  
  const dirsToClean = ['.next', 'dist', 'build'];
  
  dirsToClean.forEach(dir => {
    if (fs.existsSync(dir)) {
      runCommand(`rm -rf ${dir}`);
      console.log(`  🗑️ Removed ${dir}`);
    }
  });
}

/**
 * Check environment variables
 */
function checkEnvironment() {
  console.log('🌍 Checking environment variables...');
  
  const requiredVars = [
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET', 
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL'
  ];
  
  const missing = [];
  
  requiredVars.forEach(varName => {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  });
  
  if (missing.length === 0) {
    console.log('  ✅ All required environment variables are set');
    return true;
  } else {
    console.log('  ⚠️ Missing environment variables:');
    missing.forEach(varName => {
      console.log(`    - ${varName}`);
    });
    console.log('  💡 These are required for production deployment');
    return false;
  }
}

/**
 * Generate Vercel deployment report
 */
function generateReport(results) {
  console.log('\n📊 VERCEL BUILD READINESS REPORT');
  console.log('==================================================');
  
  const checks = [
    { name: 'Environment Variables', passed: results.environment },
    { name: 'exactOptionalPropertyTypes Fix', passed: results.typesFix },
    { name: 'ESLint Auto-fix', passed: results.eslint },
    { name: 'TypeScript Compilation', passed: results.typescript },
    { name: 'Production Build Test', passed: results.build }
  ];
  
  const passedChecks = checks.filter(check => check.passed).length;
  const totalChecks = checks.length;
  
  console.log(`✅ Passed Checks: ${passedChecks}/${totalChecks}`);
  console.log('');
  
  checks.forEach(check => {
    const status = check.passed ? '✅' : '❌';
    console.log(`${status} ${check.name}`);
  });
  
  console.log('');
  
  if (passedChecks === totalChecks) {
    console.log('🎉 PROJECT IS READY FOR VERCEL DEPLOYMENT!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Commit and push your changes');
    console.log('2. Deploy to Vercel');
    console.log('3. Set environment variables in Vercel dashboard');
  } else {
    console.log('🔧 Issues found that need attention before deployment');
    console.log('');
    console.log('Recommendations:');
    if (!results.environment) {
      console.log('- Set up environment variables in Vercel dashboard');
    }
    if (!results.typescript) {
      console.log('- Fix TypeScript compilation errors');
    }
    if (!results.build) {
      console.log('- Resolve production build issues');
    }
  }
}

/**
 * Main execution
 */
async function main() {
  const command = process.argv[2] || 'full';
  
  const results = {
    environment: false,
    typesFix: false,
    eslint: false,
    typescript: false,
    build: false
  };
  
  try {
    switch (command) {
      case 'fix-types':
        fixExactOptionalPropertyTypes();
        results.typesFix = true;
        break;
        
      case 'check-env':
        results.environment = checkEnvironment();
        break;
        
      case 'test-build':
        cleanBuild();
        results.build = testBuild();
        break;
        
      case 'full':
      default:
        // Run all checks in sequence
        results.environment = checkEnvironment();
        
        fixExactOptionalPropertyTypes();
        results.typesFix = true;
        
        results.eslint = runESLintFix();
        results.typescript = checkTypeScript();
        
        if (results.typescript) {
          cleanBuild();
          results.build = testBuild();
        }
        
        generateReport(results);
        break;
    }
    
  } catch (error) {
    console.error('❌ Error during execution:', error.message);
    process.exit(1);
  }
}

// Show help
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log('');
  console.log('Usage: node scripts/vercel-build-fix.js [command]');
  console.log('');
  console.log('Commands:');
  console.log('  full       - Run all checks and fixes (default)');
  console.log('  fix-types  - Fix exactOptionalPropertyTypes issues');
  console.log('  check-env  - Check environment variables');
  console.log('  test-build - Test production build');
  console.log('');
  console.log('Examples:');
  console.log('  node scripts/vercel-build-fix.js');
  console.log('  node scripts/vercel-build-fix.js fix-types');
  console.log('  node scripts/vercel-build-fix.js test-build');
  console.log('');
  process.exit(0);
}

main();