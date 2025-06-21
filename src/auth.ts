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
      console.log("[JWT Callback] Account:", !!account, "User:", !!user);
      if (account) {
        token.accessToken = account.access_token
        token.refreshToken = account.refresh_token
        token.provider = account.provider
        // Set initial remember me preference from localStorage (will be updated via session update)
        token.rememberMe = false;
        console.log("[JWT Callback] Saved tokens to JWT");
      }
      
      // Handle remember me preference updates
      if (trigger === "update" && session?.rememberMe !== undefined) {
        token.rememberMe = session.rememberMe;
        // Update token expiration based on remember me preference
        const maxAge = session.rememberMe 
          ? 30 * 24 * 60 * 60 // 30 days
          : 24 * 60 * 60; // 1 day
        token.exp = Math.floor(Date.now() / 1000) + maxAge;
        console.log("[JWT Callback] Updated remember me preference:", session.rememberMe, "expires in", maxAge, "seconds");
      }
      
      return token
    },
    async session({ session, token }) {
      console.log("[Session Callback] Token:", !!token.accessToken);
      session.accessToken = token.accessToken as string
      session.refreshToken = token.refreshToken as string
      session.provider = token.provider as string
      session.rememberMe = token.rememberMe as boolean
      return session
    },
    async redirect({ url, baseUrl }) {
      console.log("[Redirect Callback] URL:", url, "BaseURL:", baseUrl);
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
    maxAge: 30 * 24 * 60 * 60, // 30 days maximum
    updateAge: 24 * 60 * 60, // Update session every 24 hours
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        // Dynamic maxAge will be set based on remember me preference
      }
    }
  },
  trustHost: true,
  secret: process.env.NEXTAUTH_SECRET,
})