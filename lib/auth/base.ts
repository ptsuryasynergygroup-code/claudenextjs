import type { NextAuthConfig, DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      organizationId: string
      name: string
      email: string
    } & DefaultSession["user"]
  }

  interface User {
    organizationId: string
  }
}

export const authConfig = {
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/signin",
  },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.organizationId = (user as { organizationId: string }).organizationId
      }
      return token
    },
    async session({ session, token }) {
      if (token.id) session.user.id = token.id as string
      if (token.organizationId) {
        session.user.organizationId = token.organizationId as string
      }
      return session
    },
  },
} satisfies NextAuthConfig
