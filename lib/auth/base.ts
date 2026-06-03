import type { NextAuthConfig, DefaultSession } from "next-auth"

export type AccessScope = "org" | "branch" | "warehouse"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      organizationId: string
      branchId: string | null
      warehouseId: string | null
      scope: AccessScope
      name: string
      email: string
    } & DefaultSession["user"]
  }

  interface User {
    organizationId: string
    branchId?: string | null
    warehouseId?: string | null
    scope?: AccessScope
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
        const u = user as {
          id: string
          organizationId: string
          branchId?: string | null
          warehouseId?: string | null
          scope?: AccessScope
        }
        token.id = u.id
        token.organizationId = u.organizationId
        token.branchId = u.branchId ?? null
        token.warehouseId = u.warehouseId ?? null
        token.scope = u.scope ?? "org"
      }
      return token
    },
    async session({ session, token }) {
      if (token.id) session.user.id = token.id as string
      if (token.organizationId) session.user.organizationId = token.organizationId as string
      session.user.branchId = (token.branchId as string | null) ?? null
      session.user.warehouseId = (token.warehouseId as string | null) ?? null
      session.user.scope = (token.scope as AccessScope) ?? "org"
      return session
    },
  },
} satisfies NextAuthConfig
