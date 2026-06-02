// Auth.js v5 (next-auth@beta) configuration.
// Uses Prisma adapter + credentials provider with bcrypt password hash.
// Session token is JWT (default). Adapter is needed for Account/User linking.

import NextAuth, { type DefaultSession } from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { prisma } from "@/lib/prisma"

// Extend session payload with EOS context. Anything we read from session
// in guards/services lives here.
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

const CredentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/signin",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(raw) {
        const parsed = CredentialsSchema.safeParse(raw)
        if (!parsed.success) return null

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email, deletedAt: null },
          select: {
            id: true,
            name: true,
            email: true,
            passwordHash: true,
            status: true,
            organizationId: true,
          },
        })

        if (!user || !user.passwordHash) return null
        if (user.status !== "ACTIVE") return null

        const ok = await bcrypt.compare(parsed.data.password, user.passwordHash)
        if (!ok) return null

        // Async-but-fire-and-forget login timestamp. We don't await to keep
        // sign-in fast; failure to update is non-fatal.
        prisma.user
          .update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })
          .catch(() => {})

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          organizationId: user.organizationId,
        }
      },
    }),
  ],
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
})
