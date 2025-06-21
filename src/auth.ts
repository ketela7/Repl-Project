import NextAuth from "next-auth"
import Google from "next-auth/providers/google"

declare module "next-auth" {
  interface Session {
    accessToken?: string
    refreshToken?: string
    provider?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string
    refreshToken?: string
    provider?: string
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
    async jwt({ token, account, user }) {
      console.log("[JWT Callback] Account:", !!account, "User:", !!user);
      if (account) {
        token.accessToken = account.access_token
        token.refreshToken = account.refresh_token
        token.provider = account.provider
        console.log("[JWT Callback] Saved tokens to JWT");
      }
      return token
    },
    async session({ session, token }) {
      console.log("[Session Callback] Token:", !!token.accessToken);
      session.accessToken = token.accessToken as string
      session.refreshToken = token.refreshToken as string
      session.provider = token.provider as string
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
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    }
  },
  trustHost: true,
  secret: process.env.NEXTAUTH_SECRET,
})