import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the actual domain from headers for proper redirect
    const forwardedHost = request.headers.get('x-forwarded-host')
    const isLocalEnv = process.env.NODE_ENV === 'development'
    let redirectUrl
    
    if (isLocalEnv && forwardedHost) {
      redirectUrl = `https://${forwardedHost}/dashboard/drive`
    } else {
      redirectUrl = `${request.nextUrl.origin}/dashboard/drive`
    }
    
    console.log('Drive OAuth redirect URL:', redirectUrl);
    
    // Request Google OAuth with Drive scope specifically
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        scopes: 'openid email profile https://www.googleapis.com/auth/drive',
        queryParams: {
          access_type: 'offline',
          prompt: 'consent', // Force consent screen to show Drive permissions
          include_granted_scopes: 'true' // Important for incremental authorization
        }
      },
    })

    if (error) {
      console.error('Google Drive auth error:', error)
      return NextResponse.redirect(`${redirectUrl}?error=auth_failed`)
    }

    console.log('Google Drive OAuth URL generated:', data.url);
    // Redirect to Google OAuth
    return NextResponse.redirect(data.url)
  } catch (error) {
    console.error('Google Drive auth error:', error)
    return NextResponse.redirect(`${request.nextUrl.origin}/dashboard/drive?error=server_error`)
  }
}