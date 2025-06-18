import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  console.log('=== Auth Callback Started ===')
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')
  const next = searchParams.get('next') ?? '/dashboard'

  console.log('Callback params:', { 
    code: code ? 'present' : 'missing', 
    error, 
    errorDescription,
    next,
    origin 
  })

  if (error) {
    console.error('OAuth error in callback:', error, errorDescription)
    const forwardedHost = request.headers.get('x-forwarded-host')
    const isLocalEnv = process.env.NODE_ENV === 'development'
    let errorRedirectUrl
    
    if (isLocalEnv && forwardedHost) {
      errorRedirectUrl = `https://${forwardedHost}/auth/auth-code-error?error=${encodeURIComponent(error)}&description=${encodeURIComponent(errorDescription || '')}`
    } else {
      errorRedirectUrl = `${origin}/auth/auth-code-error?error=${encodeURIComponent(error)}&description=${encodeURIComponent(errorDescription || '')}`
    }
    
    return NextResponse.redirect(errorRedirectUrl)
  }

  if (code) {
    console.log('Processing auth code...')
    const supabase = await createClient()
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    
    console.log('Exchange result:', { 
      success: !exchangeError, 
      error: exchangeError?.message,
      user: data?.user?.email 
    })
    
    if (!exchangeError) {
      // Get the actual domain from headers for proper redirect
      const forwardedHost = request.headers.get('x-forwarded-host')
      const isLocalEnv = process.env.NODE_ENV === 'development'
      let redirectUrl
      
      if (isLocalEnv && forwardedHost) {
        redirectUrl = `https://${forwardedHost}${next}`
      } else {
        redirectUrl = `${origin}${next}`
      }
      
      console.log('Successful auth, redirecting to:', redirectUrl)
      return NextResponse.redirect(redirectUrl)
    } else {
      console.error('Session exchange failed:', exchangeError)
    }
  }

  // return the user to an error page with instructions
  const forwardedHost = request.headers.get('x-forwarded-host')
  const isLocalEnv = process.env.NODE_ENV === 'development'
  let errorRedirectUrl
  
  if (isLocalEnv && forwardedHost) {
    errorRedirectUrl = `https://${forwardedHost}/auth/auth-code-error`
  } else {
    errorRedirectUrl = `${origin}/auth/auth-code-error`
  }
  
  return NextResponse.redirect(errorRedirectUrl)
}