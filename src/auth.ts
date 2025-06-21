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

const authConfig = {
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
    async jwt({ token, account }) {
      // Persist the OAuth access_token to the token right after signin
      if (account) {
        token.accessToken = account.access_token
        token.refreshToken = account.refresh_token
        token.provider = account.provider
      }
      return token
    },
    async session({ session, token }) {
      // Send properties to the client
      session.accessToken = token.accessToken as string
      session.refreshToken = token.refreshToken as string
      session.provider = token.provider as string
      return session
    },
  },
  pages: {
    signIn: '/auth/v1/login',
  },
}

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig)