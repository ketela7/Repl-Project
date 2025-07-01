#!/usr/bin/env node

/**
 * Lighthouse Performance Testing Script
 * Tests Core Web Vitals and performance metrics
 */

const { spawn } = require('child_process')
const fs = require('fs')
const date = new Date().toISOString().slice(0, 10)

console.log('🔍 Lighthouse Performance Testing')
console.log('==================================')

// Configuration
const testUrl = 'http://localhost:5000'
const outputDir = 'lighthouse-reports'
const outputFile = `${outputDir}/report-${date}.html`
const jsonOutputFile = `${outputDir}/report-${date}.json`

// Create output directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true })
}

// Function to check if server is running
function checkServer() {
  console.log('⏳ Checking if server is running...')
  
  return new Promise((resolve, reject) => {
    const http = require('http')
    const request = http.get(testUrl, (res) => {
      console.log('✅ Server is running')
      resolve(true)
    })
    
    request.on('error', () => {
      console.log('❌ Server is not running. Please start the server first.')
      console.log('💡 Run: npm run dev')
      resolve(false)
    })
    
    request.setTimeout(5000, () => {
      console.log('⏰ Server check timeout')
      resolve(false)
    })
  })
}

// Function to run Lighthouse
async function runLighthouse() {
  const serverRunning = await checkServer()
  if (!serverRunning) {
    return false
  }

  console.log('🚀 Running Lighthouse performance audit...')
  console.log(`📊 Testing: ${testUrl}`)
  
  return new Promise((resolve, reject) => {
    // Check if lighthouse is installed globally, if not suggest installation
    const lighthouse = spawn('npx', [
      'lighthouse',
      testUrl,
      '--output=html,json',
      '--output-path=' + outputFile.replace('.html', ''),
      '--chrome-flags=--headless',
      '--quiet',
      '--only-categories=performance',
      '--disable-storage-reset'
    ])

    let output = ''
    let errorOutput = ''

    lighthouse.stdout.on('data', (data) => {
      output += data.toString()
      process.stdout.write('.')
    })

    lighthouse.stderr.on('data', (data) => {
      errorOutput += data.toString()
    })

    lighthouse.on('close', (code) => {
      console.log('\n')
      
      if (code === 0) {
        console.log('✅ Lighthouse audit completed successfully!')
        console.log(`📄 HTML Report: ${outputFile}`)
        console.log(`📊 JSON Report: ${jsonOutputFile}`)
        
        // Try to extract key metrics from JSON
        if (fs.existsSync(jsonOutputFile)) {
          analyzeResults(jsonOutputFile)
        }
        
        resolve(true)
      } else {
        console.log('❌ Lighthouse audit failed')
        if (errorOutput.includes('lighthouse: not found')) {
          console.log('💡 Install Lighthouse: npm install -g lighthouse')
        } else {
          console.log('Error:', errorOutput)
        }
        resolve(false)
      }
    })
  })
}

// Function to analyze Lighthouse results
function analyzeResults(jsonFile) {
  try {
    console.log('\n📈 Performance Metrics Analysis')
    console.log('===============================')
    
    const report = JSON.parse(fs.readFileSync(jsonFile, 'utf8'))
    const audits = report.audits
    
    // Core Web Vitals
    const metrics = {
      'First Contentful Paint': audits['first-contentful-paint']?.displayValue,
      'Largest Contentful Paint': audits['largest-contentful-paint']?.displayValue,
      'Total Blocking Time': audits['total-blocking-time']?.displayValue,
      'Cumulative Layout Shift': audits['cumulative-layout-shift']?.displayValue,
      'Speed Index': audits['speed-index']?.displayValue
    }

    Object.entries(metrics).forEach(([metric, value]) => {
      if (value) {
        console.log(`📊 ${metric}: ${value}`)
      }
    })

    // Performance Score
    const performanceScore = report.categories.performance?.score
    if (performanceScore) {
      const score = Math.round(performanceScore * 100)
      const emoji = score >= 90 ? '🟢' : score >= 50 ? '🟡' : '🔴'
      console.log(`\n${emoji} Performance Score: ${score}/100`)
      
      if (score >= 90) {
        console.log('🎉 Excellent performance!')
      } else if (score >= 50) {
        console.log('⚠️  Performance needs improvement')
      } else {
        console.log('🚨 Poor performance - immediate optimization needed')
      }
    }

    // Opportunities
    const opportunities = Object.keys(audits)
      .filter(key => audits[key].details && audits[key].score !== null && audits[key].score < 1)
      .slice(0, 5)

    if (opportunities.length > 0) {
      console.log('\n🔧 Top Optimization Opportunities:')
      opportunities.forEach((key, index) => {
        const audit = audits[key]
        if (audit.title && audit.displayValue) {
          console.log(`${index + 1}. ${audit.title}: ${audit.displayValue}`)
        }
      })
    }

  } catch (error) {
    console.log('❌ Failed to analyze results:', error.message)
  }
}

// Main execution
async function main() {
  const success = await runLighthouse()
  
  if (success) {
    console.log('\n🎯 Performance Testing Complete!')
    console.log('💡 Tips for improvement:')
    console.log('  - Check Core Web Vitals scores')
    console.log('  - Optimize largest contentful paint')
    console.log('  - Reduce blocking time')
    console.log('  - Monitor cumulative layout shift')
  } else {
    console.log('\n❌ Performance testing failed')
  }
}

main()