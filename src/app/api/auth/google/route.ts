import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('Google auth request received')

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