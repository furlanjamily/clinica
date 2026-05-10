import { compare } from "bcrypt";
import { timingSafeEqual } from "node:crypto";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "./db";
import type { UserRoleType } from "@/types/auth";
import { USER_ROLES } from "@/types/auth";
import { isDemoAuthEnabled, resolvedDemoCredentials } from "@/lib/demo-env";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

function timingSafeStringEqual(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a, "utf8")
    const bufB = Buffer.from(b, "utf8")
    if (bufA.length !== bufB.length) return false
    return timingSafeEqual(bufA, bufB)
  } catch {
    return false
  }
}

function tryAuthorizePortfolioDemo(
  email: string,
  password: string
): { id: string; name: string; username: string; email: string; role: UserRoleType | null } | null {
  if (!isDemoAuthEnabled()) return null

  const demo = resolvedDemoCredentials()
  if (!demo) return null

  if (normalizeEmail(email) !== normalizeEmail(demo.email)) return null
  if (!timingSafeStringEqual(password, demo.password)) return null

  const rawRole = process.env.DEMO_LOGIN_ROLE?.trim()
  const role: UserRoleType | null =
    rawRole && (USER_ROLES as readonly string[]).includes(rawRole)
      ? (rawRole as UserRoleType)
      : "SUPER_ADMIN"

  return {
    id: "portfolio-demo",
    name: "Visitante (demo)",
    username: "Visitante (demo)",
    email: normalizeEmail(demo.email),
    role,
  }
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/sign-in",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const demoUser = tryAuthorizePortfolioDemo(credentials.email, credentials.password)
        if (demoUser) return demoUser

        const user = await db.user.findUnique({
          where: { email: credentials.email },
        })

        if (!user || !user.password) return null

        const passwordMatch = await compare(credentials.password, user.password)
        if (!passwordMatch) return null

        return {
          id: user.id,
          name: user.name ?? user.email ?? user.id,
          username: user.name,
          email: user.email,
          role: user.role as UserRoleType | null,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.username = user.username ?? user.name ?? null
        token.role = user.role ?? null
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id ?? ""
        session.user.username = token.username ?? null
        session.user.role = token.role as UserRoleType | null ?? null
        session.user.name = token.username ?? session.user.name ?? null
      }
      return session
    },
  },
}
