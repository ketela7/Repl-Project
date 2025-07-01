#!/usr/bin/env node

/**
 * Performance Analysis Script
 * Analyzes bundle size, performance metrics, and optimization opportunities
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

console.log('🚀 Performance Analysis Tool')
console.log('============================')

// 1. Bundle Size Analysis
function analyzeBundleSize() {
  console.log('\n📦 Bundle Size Analysis')
  console.log('------------------------')
  
  try {
    // Check if .next directory exists
    const nextDir = '.next'
    if (!fs.existsSync(nextDir)) {
      console.log('⚠️  No build found. Run npm run build first.')
      return
    }

    // Analyze static chunks
    const staticDir = path.join(nextDir, 'static', 'chunks')
    if (fs.existsSync(staticDir)) {
      const chunks = fs.readdirSync(staticDir)
        .filter(file => file.endsWith('.js'))
        .map(file => {
          const filePath = path.join(staticDir, file)
          const stats = fs.statSync(filePath)
          return {
            name: file,
            size: stats.size,
            sizeKB: Math.round(stats.size / 1024 * 100) / 100
          }
        })
        .sort((a, b) => b.size - a.size)

      console.log('\n📋 JavaScript Chunks (Top 10):')
      chunks.slice(0, 10).forEach(chunk => {
        const sizeIndicator = chunk.sizeKB > 500 ? '🔴' : chunk.sizeKB > 200 ? '🟡' : '🟢'
        console.log(`${sizeIndicator} ${chunk.name}: ${chunk.sizeKB} KB`)
      })

      const totalSize = chunks.reduce((sum, chunk) => sum + chunk.size, 0)
      const totalSizeKB = Math.round(totalSize / 1024 * 100) / 100
      console.log(`\n📊 Total JS Bundle Size: ${totalSizeKB} KB`)
      
      // Recommendations
      if (totalSizeKB > 1000) {
        console.log('⚠️  Bundle size is large. Consider more aggressive code splitting.')
      } else if (totalSizeKB > 500) {
        console.log('✅ Bundle size is acceptable but can be optimized.')
      } else {
        console.log('✅ Bundle size is well optimized!')
      }
    }
  } catch (error) {
    console.log('❌ Bundle analysis failed:', error.message)
  }
}

// 2. Performance Metrics Analysis
function analyzePerformanceMetrics() {
  console.log('\n⚡ Performance Metrics Analysis')
  console.log('-------------------------------')
  
  try {
    // Check next.config.js for optimizations
    const nextConfig = fs.readFileSync('next.config.js', 'utf8')
    
    const optimizations = {
      compression: nextConfig.includes('compress: true'),
      reactStrictMode: nextConfig.includes('reactStrictMode: true'),
      optimizePackageImports: nextConfig.includes('optimizePackageImports'),
      splitChunks: nextConfig.includes('splitChunks'),
      removeConsole: nextConfig.includes('removeConsole'),
      caching: nextConfig.includes('Cache-Control')
    }

    console.log('\n🔧 Next.js Optimizations:')
    Object.entries(optimizations).forEach(([key, enabled]) => {
      const icon = enabled ? '✅' : '❌'
      console.log(`${icon} ${key}: ${enabled ? 'Enabled' : 'Disabled'}`)
    })

    const enabledCount = Object.values(optimizations).filter(Boolean).length
    const totalCount = Object.keys(optimizations).length
    
    console.log(`\n📊 Optimization Score: ${enabledCount}/${totalCount} (${Math.round(enabledCount/totalCount*100)}%)`)
    
  } catch (error) {
    console.log('❌ Performance metrics analysis failed:', error.message)
  }
}

// 3. Lazy Loading Analysis
function analyzeLazyLoading() {
  console.log('\n🔄 Lazy Loading Analysis')
  console.log('-------------------------')
  
  try {
    const lazyImportsFile = 'src/components/lazy-imports.tsx'
    if (fs.existsSync(lazyImportsFile)) {
      const content = fs.readFileSync(lazyImportsFile, 'utf8')
      const lazyComponents = (content.match(/export const \w+ = lazy/g) || []).length
      
      console.log(`✅ Lazy Components Found: ${lazyComponents}`)
      
      // Check for preloading
      const performanceUtils = 'src/lib/utils/performance-utils.ts'
      if (fs.existsSync(performanceUtils)) {
        const perfContent = fs.readFileSync(performanceUtils, 'utf8')
        const hasPreloading = perfContent.includes('preloadCriticalComponents')
        const hasRetry = perfContent.includes('lazyWithRetry')
        const hasDNSPrefetch = perfContent.includes('dns-prefetch')
        
        console.log(`${hasPreloading ? '✅' : '❌'} Component Preloading: ${hasPreloading ? 'Implemented' : 'Missing'}`)
        console.log(`${hasRetry ? '✅' : '❌'} Lazy Load Retry: ${hasRetry ? 'Implemented' : 'Missing'}`)
        console.log(`${hasDNSPrefetch ? '✅' : '❌'} DNS Prefetching: ${hasDNSPrefetch ? 'Implemented' : 'Missing'}`)
      }
    } else {
      console.log('❌ Lazy imports file not found')
    }
  } catch (error) {
    console.log('❌ Lazy loading analysis failed:', error.message)
  }
}

// 4. API Performance Analysis
function analyzeAPIPerformance() {
  console.log('\n🌐 API Performance Analysis')
  console.log('---------------------------')
  
  try {
    // Check for caching
    const cacheFile = 'src/lib/cache.ts'
    const throttleFile = 'src/lib/api-throttle.ts'
    const retryFile = 'src/lib/api-retry.ts'
    
    console.log(`${fs.existsSync(cacheFile) ? '✅' : '❌'} API Caching: ${fs.existsSync(cacheFile) ? 'Implemented' : 'Missing'}`)
    console.log(`${fs.existsSync(throttleFile) ? '✅' : '❌'} API Throttling: ${fs.existsSync(throttleFile) ? 'Implemented' : 'Missing'}`)
    console.log(`${fs.existsSync(retryFile) ? '✅' : '❌'} API Retry Logic: ${fs.existsSync(retryFile) ? 'Implemented' : 'Missing'}`)
    
    // Check for field optimization
    const fieldOptFile = 'src/lib/google-drive/progressive-fields.ts'
    if (fs.existsSync(fieldOptFile)) {
      const content = fs.readFileSync(fieldOptFile, 'utf8')
      const hasFieldOptimization = content.includes('BASIC_FIELDS') && content.includes('ESSENTIAL_FIELDS')
      console.log(`${hasFieldOptimization ? '✅' : '❌'} Field Optimization: ${hasFieldOptimization ? 'Implemented' : 'Missing'}`)
    }
    
  } catch (error) {
    console.log('❌ API performance analysis failed:', error.message)
  }
}

// 5. Generate Performance Report
function generatePerformanceReport() {
  console.log('\n📋 Performance Optimization Recommendations')
  console.log('===========================================')
  
  const recommendations = []
  
  // Check if build exists for more accurate analysis
  if (!fs.existsSync('.next')) {
    recommendations.push('🔧 Run `npm run build` to enable detailed bundle analysis')
  }
  
  // Check package.json for performance scripts
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))
    const scripts = packageJson.scripts || {}
    
    if (!scripts['build:analyze']) {
      recommendations.push('📊 Add bundle analyzer: `npm install --save-dev @next/bundle-analyzer`')
    }
    
    if (!scripts['lighthouse']) {
      recommendations.push('🔍 Add Lighthouse performance testing script')
    }
    
  } catch (error) {
    recommendations.push('❌ Could not analyze package.json scripts')
  }
  
  // Check for Web Vitals monitoring
  const webVitalsFile = 'src/lib/web-vitals.ts'
  if (!fs.existsSync(webVitalsFile)) {
    recommendations.push('📈 Implement Web Vitals monitoring for Core Web Vitals tracking')
  }
  
  // Check for image optimization
  const hasImageComponent = fs.readdirSync('src', { recursive: true })
    .some(file => typeof file === 'string' && file.includes('Image'))
  
  if (!hasImageComponent) {
    recommendations.push('🖼️  Implement Next.js Image component for automatic image optimization')
  }
  
  if (recommendations.length === 0) {
    console.log('✅ All major performance optimizations are in place!')
  } else {
    recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. ${rec}`)
    })
  }
}

// Run all analyses
function runAnalysis() {
  analyzeBundleSize()
  analyzePerformanceMetrics()
  analyzeLazyLoading()
  analyzeAPIPerformance()
  generatePerformanceReport()
  
  console.log('\n🎯 Performance Analysis Complete!')
  console.log('Run this script after each optimization to track improvements.')
}

runAnalysis()