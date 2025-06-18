import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

async function verifyTurnstile(token: string): Promise<boolean> {
  try {
    // Skip verification in development for testing
    if (process.env.NODE_ENV === 'development' && token === 'test') {
      console.log('Skipping Turnstile verification in development mode');
      return true;
    }

    const formData = new FormData()
    formData.append('secret', process.env.TURNSTILE_SECRET_KEY!)
    formData.append('response', token)

    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
    })

    const result = await response.json()
    console.log('Turnstile verification result:', result);
    return result.success
  } catch (error) {
    console.error('Turnstile verification error:', error)
    return false
  }
}

export async function POST(request: NextRequest) {
  try {
    const { turnstileToken } = await request.json()
    console.log('Google auth request received, token:', turnstileToken)

    // Verify Turnstile token first
    const isValidTurnstile = await verifyTurnstile(turnstileToken)
    
    if (!isValidTurnstile) {
      console.log('Turnstile verification failed')
      return NextResponse.json({ error: 'CAPTCHA verification failed' }, { status: 400 })
    }

    console.log('Turnstile verification passed, proceeding with Google OAuth')

    // Proceed with Google OAuth (include Drive scope from start)
    const supabase = await createClient()
    
    // Get the actual domain from headers for proper redirect
    const forwardedHost = request.headers.get('x-forwarded-host')
    const isLocalEnv = process.env.NODE_ENV === 'development'
    let redirectUrl
    
    if (isLocalEnv && forwardedHost) {
      redirectUrl = `https://${forwardedHost}/api/auth/callback`
    } else {
      redirectUrl = `${request.nextUrl.origin}/api/auth/callback`
    }
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        scopes: 'openid email profile https://www.googleapis.com/auth/drive',
        queryParams: {
          access_type: 'offline'
        }
      },
    })

    if (error) {
      console.error('Supabase OAuth error:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    console.log('OAuth URL generated successfully:', data.url)
    return NextResponse.json({ url: data.url })
  } catch (error) {
    console.error('Google auth error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}