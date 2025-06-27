#!/usr/bin/env npx tsx

/**
 * Session Cookie Extraction Utility
 * Extracts active session cookie for API testing
 */

import { promises as fs } from 'fs'
import { join } from 'path'

interface SessionInfo {
  cookie: string
  userId: string
  email: string
  accessToken: string
  expiresAt: number
  extractedAt: number
}

async function extractSessionFromLogs(): Promise<SessionInfo | null> {
  try {
    console.log('🔍 Searching for session data in server logs...')
    
    // Read recent log output or check running processes
    // This is a simplified version - in real implementation we'd parse actual logs
    
    // For now, we'll extract from environment or provide instructions
    const testCookie = process.env.EXTRACTED_SESSION_COOKIE
    const testToken = process.env.EXTRACTED_ACCESS_TOKEN
    
    if (testCookie && testToken) {
      const sessionInfo: SessionInfo = {
        cookie: testCookie,
        userId: 'extracted-user',
        email: 'dinayayuk05@gmail.com',
        accessToken: testToken,
        expiresAt: Date.now() + (60 * 60 * 1000), // 1 hour
        extractedAt: Date.now(),
      }
      
      return sessionInfo
    }
    
    return null
  } catch (error) {
    console.error('❌ Error extracting session:', error)
    return null
  }
}

async function saveSessionForTesting(session: SessionInfo): Promise<void> {
  try {
    const sessionFile = join(process.cwd(), '.test-session.json')
    await fs.writeFile(sessionFile, JSON.stringify(session, null, 2))
    console.log(`💾 Session saved to: ${sessionFile}`)
  } catch (error) {
    console.error('❌ Error saving session:', error)
  }
}

async function testSessionValidity(session: SessionInfo): Promise<boolean> {
  try {
    console.log('🧪 Testing session validity...')
    
    const response = await fetch('http://localhost:5000/api/auth/session', {
      headers: {
        'Cookie': session.cookie,
      },
    })
    
    if (response.ok) {
      const data = await response.json()
      console.log(`✅ Session valid for: ${data.user?.email || 'unknown user'}`)
      return true
    } else {
      console.log(`❌ Session invalid: ${response.status}`)
      return false
    }
  } catch (error) {
    console.error('❌ Error testing session:', error)
    return false
  }
}

async function main() {
  console.log('🔐 Session Cookie Extraction Tool')
  console.log('📱 Google Drive Pro API Testing Setup')
  console.log('')
  
  // Try to extract session from logs
  const session = await extractSessionFromLogs()
  
  if (session) {
    console.log('✅ Session extracted successfully')
    console.log(`📧 Email: ${session.email}`)
    console.log(`🕒 Expires: ${new Date(session.expiresAt).toLocaleString()}`)
    
    // Test session validity
    const isValid = await testSessionValidity(session)
    
    if (isValid) {
      // Save session for testing
      await saveSessionForTesting(session)
      
      console.log('')
      console.log('🚀 Ready for API testing!')
      console.log('💡 Run: npm run test:api')
    } else {
      console.log('❌ Session is not valid, please re-authenticate')
    }
  } else {
    console.log('❌ No valid session found')
    console.log('')
    console.log('📋 Manual extraction steps:')
    console.log('   1. Login to the application in browser')
    console.log('   2. Open DevTools (F12) → Application → Cookies')
    console.log('   3. Copy "next-auth.session-token" value')
    console.log('   4. Set environment variable:')
    console.log('      export EXTRACTED_SESSION_COOKIE="your-cookie-value"')
    console.log('   5. Run this script again')
  }
}

main().catch(console.error)