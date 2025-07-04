import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'

// Validate required environment variables
function validateEnvVars() {
  const required = ['NEXTAUTH_SECRET', 'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET']
  const missing = required.filter(key => !process.env[key])

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }
}

// Validate on module load
validateEnvVars()

declare module 'next-auth' {
  interface Session {
    accessToken?: string
    refreshToken?: string
    provider?: string
    rememberMe?: boolean
  }
}

declare module 'next-auth' {
  interface JWT {
    accessToken?: string
    refreshToken?: string
    provider?: string
    rememberMe?: boolean
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'openid email profile https://www.googleapis.com/auth/drive',
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    }),
  ],

  callbacks: {
    async jwt({ token, account, user, trigger, session }) {
      // Store tokens for API access
      if (account && user) {
        token.userId = user.id
      }
      if (account) {
        token.accessToken = account.access_token
        token.refreshToken = account.refresh_token
        token.provider = account.provider
        // Set initial remember me preference - will be updated via session callback
        token.rememberMe = false
      }

      // Handle token refresh on every request if needed
      if (
        token.refreshToken &&
        (!token.accessToken || (account?.expires_at && Date.now() >= account.expires_at * 1000))
      ) {
        try {
          const response = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              client_id: process.env.GOOGLE_CLIENT_ID!,
              client_secret: process.env.GOOGLE_CLIENT_SECRET!,
              grant_type: 'refresh_token',
              refresh_token: token.refreshToken as string,
            }),
          })

          if (response.ok) {
            const refreshedTokens = await response.json()
            token.accessToken = refreshedTokens.access_token
            if (refreshedTokens.refresh_token) {
              token.refreshToken = refreshedTokens.refresh_token
            }
            token.exp = Math.floor(Date.now() / 1000) + (refreshedTokens.expires_in || 3600)
          } else {
            // // // // // console.error('Token refresh failed:', response.status)
            token.accessToken = undefined
          }
        } catch (error) {
          // // // // // console.error('Token refresh error:', error)
          token.accessToken = undefined
        }
      }

      // Handle remember me preference updates from client-side session update
      if (trigger === 'update' && session?.rememberMe !== undefined) {
        token.rememberMe = session.rememberMe

        // Update token expiration based on remember me preference
        const sessionDuration = session.rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60
        token.exp = Math.floor(Date.now() / 1000) + sessionDuration
      }

      // Set initial remember me state and expiration during account creation
      if (account && token.exp === undefined) {
        // Default to false if not set; will be updated by client-side session update
        token.rememberMe = false
        // Set initial expiration to 1 day (default)
        token.exp = Math.floor(Date.now() / 1000) + 24 * 60 * 60
      }

      return token
    },
    async session({ session, token }) {
      // Build session object with tokens
      return {
        ...session,
        ...((token.accessToken as string) && { accessToken: token.accessToken as string }),
        ...((token.refreshToken as string) && { refreshToken: token.refreshToken as string }),
        provider: (token.provider as string) || 'google',
        rememberMe: Boolean(token.rememberMe),
      }
    },
    async redirect({ url, baseUrl }) {
      // Always redirect to dashboard after successful authentication
      if (url === baseUrl || url === `${baseUrl}/` || url === `${baseUrl}/auth/v1/login`) {
        return `${baseUrl}/dashboard/drive`
      }
      // If it's a valid internal URL, use it
      if (url.startsWith(baseUrl)) {
        return url
      }
      // Default fallback to dashboard
      return `${baseUrl}/dashboard/drive`
    },
  },
  pages: {
    signIn: '/auth/v1/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // Default: 1 day (will be overridden for remember me)
    updateAge: 24 * 60 * 60, // Update session only once per day to reduce database calls
  },
  jwt: {
    maxAge: 24 * 60 * 60, // Default: 1 day (will be overridden for remember me)
  },
  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === 'production'
          ? '__Secure-next-auth.session-token'
          : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60, // Default: 1 day (will be extended for remember me)
      },
    },
    state: {
      name: process.env.NODE_ENV === 'production' ? '__Secure-authjs.state' : 'authjs.state',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60, // 15 minutes
      },
    },
    pkceCodeVerifier: {
      name:
        process.env.NODE_ENV === 'production'
          ? '__Secure-authjs.pkce.code_verifier'
          : 'authjs.pkce.code_verifier',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60, // 15 minutes
      },
    },
  },
  trustHost: true,
  secret: process.env.NEXTAUTH_SECRET || '',
  debug: process.env.NODE_ENV === 'development',
})
