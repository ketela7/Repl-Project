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
        // Set initial remember me preference - will be updated via session callback
        token.rememberMe = false;
        console.log("[JWT Callback] Saved tokens to JWT");
      }
      
      // Handle remember me preference updates from client-side session update
      if (trigger === "update" && session?.rememberMe !== undefined) {
        token.rememberMe = session.rememberMe;
        console.log("[JWT Callback] Updated remember me preference from session update:", session.rememberMe);
      }
      
      // Set initial remember me state from localStorage during account creation
      if (account && !token.rememberMe) {
        // Default to false if not set; will be updated by client-side session update
        token.rememberMe = false;
        console.log("[JWT Callback] Set initial remember me preference:", false);
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
    maxAge: 30 * 24 * 60 * 60, // 30 days maximum for remember me
    updateAge: 24 * 60 * 60, // Update session every 24 hours
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days maximum for remember me
  },
  trustHost: true,
  secret: process.env.NEXTAUTH_SECRET,
})