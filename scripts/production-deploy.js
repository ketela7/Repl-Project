#!/usr/bin/env node

/**
 * Production Deployment Validation Script
 * Comprehensive checks before deployment to ensure production readiness
 */

const fs = require('fs')
const { execSync } = require('child_process')

console.log('🚀 Production Deployment Validation')
console.log('=====================================')

const checks = {
  environment: false,
  dependencies: false,
  config: false,
  security: false,
  build: false,
}

// 1. Environment Variables Check
console.log('\n🔐 Checking Environment Variables...')
try {
  const requiredEnvVars = ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'NEXTAUTH_SECRET', 'NEXTAUTH_URL']
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName])
  
  if (missingVars.length === 0) {
    console.log('✅ All required environment variables are configured')
    checks.environment = true
  } else {
    console.log(`❌ Missing environment variables: ${missingVars.join(', ')}`)
  }
} catch (error) {
  console.log('❌ Environment variable check failed')
}

// 2. Configuration Files Check
console.log('\n📋 Checking Configuration Files...')
try {
  const configFiles = [
    'next.config.js',
    'package.json',
    'tsconfig.json',
    'src/auth.ts',
    'src/lib/config.ts'
  ]
  
  const missingFiles = configFiles.filter(file => !fs.existsSync(file))
  
  if (missingFiles.length === 0) {
    console.log('✅ All configuration files present')
    checks.config = true
  } else {
    console.log(`❌ Missing configuration files: ${missingFiles.join(', ')}`)
  }
} catch (error) {
  console.log('❌ Configuration check failed')
}

// 3. Security Configuration Check
console.log('\n🔒 Checking Security Configuration...')
try {
  const nextConfig = fs.readFileSync('next.config.js', 'utf8')
  const hasSecurityHeaders = nextConfig.includes('X-Frame-Options') && 
                            nextConfig.includes('X-Content-Type-Options') &&
                            nextConfig.includes('Referrer-Policy')
  
  const securityMiddleware = fs.existsSync('src/middleware/security.ts')
  
  if (hasSecurityHeaders && securityMiddleware) {
    console.log('✅ Security headers and middleware configured')
    checks.security = true
  } else {
    console.log('❌ Security configuration incomplete')
  }
} catch (error) {
  console.log('❌ Security check failed')
}

// 4. Build Configuration Check
console.log('\n🔧 Checking Build Configuration...')
try {
  const nextConfig = fs.readFileSync('next.config.js', 'utf8')
  const hasProductionOptimizations = nextConfig.includes('compress: true') &&
                                   nextConfig.includes('reactStrictMode: true') &&
                                   nextConfig.includes('removeConsole')
  
  const tsIgnoreBuildErrors = !nextConfig.includes('ignoreBuildErrors: true')
  
  if (hasProductionOptimizations && tsIgnoreBuildErrors) {
    console.log('✅ Production build configuration optimized')
    checks.build = true
  } else {
    console.log('❌ Build configuration needs optimization')
  }
} catch (error) {
  console.log('❌ Build configuration check failed')
}

// 5. Dependencies Check
console.log('\n📦 Checking Production Dependencies...')
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))
  const criticalDeps = ['next', 'react', 'next-auth', 'googleapis']
  const missingDeps = criticalDeps.filter(dep => !packageJson.dependencies[dep])
  
  if (missingDeps.length === 0) {
    console.log('✅ All critical dependencies present')
    checks.dependencies = true
  } else {
    console.log(`❌ Missing critical dependencies: ${missingDeps.join(', ')}`)
  }
} catch (error) {
  console.log('❌ Dependencies check failed')
}

// Summary
console.log('\n📊 Production Readiness Summary')
console.log('================================')

const passedChecks = Object.values(checks).filter(Boolean).length
const totalChecks = Object.keys(checks).length

Object.entries(checks).forEach(([check, passed]) => {
  const icon = passed ? '✅' : '❌'
  const status = passed ? 'PASSED' : 'FAILED'
  console.log(`${icon} ${check.toUpperCase()}: ${status}`)
})

console.log(`\n🎯 Overall Score: ${passedChecks}/${totalChecks} checks passed`)

if (passedChecks === totalChecks) {
  console.log('\n🚀 ✅ READY FOR PRODUCTION DEPLOYMENT!')
  console.log('   Run: npm run build && npm run start')
  process.exit(0)
} else {
  console.log('\n⚠️  ❌ NOT READY FOR PRODUCTION')
  console.log('   Please fix the failed checks before deploying')
  process.exit(1)
}