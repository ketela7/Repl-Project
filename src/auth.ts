import NextAuth from "next-auth"
import Google from "next-auth/providers/google"

declare module "next-auth" {
  interface Session {
    accessToken?: string
    refreshToken?: string
    provider?: string
    rememberMe?: boolean
  }
}

declare module "next-auth/jwt" {
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
          scope: "openid email profile https://www.googleapis.com/auth/drive",
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, user, trigger, session }) {
      if (account) {
        token.accessToken = account.access_token
        token.refreshToken = account.refresh_token
        token.provider = account.provider
        // Set initial remember me preference - will be updated via session callback
        token.rememberMe = false;
      }
      
      // Handle remember me preference updates from client-side session update
      if (trigger === "update" && session?.rememberMe !== undefined) {
        token.rememberMe = session.rememberMe;
        
        // Update token expiration based on remember me preference
        const sessionDuration = session.rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60;
        token.exp = Math.floor(Date.now() / 1000) + sessionDuration;
      }
      
      // Set initial remember me state from localStorage during account creation
      if (account && !token.rememberMe) {
        // Default to false if not set; will be updated by client-side session update
        token.rememberMe = false;
      }
      
      return token
    },
    async session({ session, token }) {
      // Check if session should expire based on remember me preference
      const now = Math.floor(Date.now() / 1000);
      const sessionDuration = token.rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60; // 30 days or 1 day
      const sessionExpiry = (token.iat || now) + sessionDuration;
      
      // If session has expired based on remember me preference, return null to force re-login
      if (now > sessionExpiry) {
        return null;
      }
      
      session.accessToken = token.accessToken as string
      session.refreshToken = token.refreshToken as string
      session.provider = token.provider as string
      session.rememberMe = token.rememberMe as boolean
      return session
    },
    async redirect({ url, baseUrl }) {
      // After successful sign in, redirect to dashboard
      if (url.startsWith(baseUrl)) {
        return url
      }
      return `${baseUrl}/dashboard/drive`
    },
  },
  pages: {
    signIn: '/auth/v1/login',
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // Default 1 day (24 hours)
    updateAge: 24 * 60 * 60, // Update session every 24 hours
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // Maximum 30 days (actual duration controlled by session callback)
  },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' 
        ? '__Secure-next-auth.session-token' 
        : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 30 * 24 * 60 * 60, // Maximum 30 days (will be limited by JWT maxAge)
      }
    }
  },
  trustHost: true,
  secret: process.env.NEXTAUTH_SECRET,
})