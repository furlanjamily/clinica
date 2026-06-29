import { compare } from "bcrypt";
import { timingSafeEqual } from "node:crypto";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "./db";
import type { UserRoleType } from "@/types/auth";
import { USER_ROLES } from "@/types/auth";
import { resolvedDemoCredentials } from "@/lib/demo-env";
import { applyTokenUserSnapshot, loadTokenUserSnapshot } from "@/lib/auth/refresh-token-user";

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
): { id: string; name: string; username: string; email: string; role: UserRoleType | null; doctorId: number | null; image: string | null } | null {
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
    name: "Dr.Teste",
    username: "Dr.Teste",
    email: normalizeEmail(demo.email),
    role,
    doctorId: null,
    image: null,
  }
}

async function resolvePortfolioDemoUser(
  demoEmail: string,
  fallbackRole: UserRoleType | null
) {
  const dbUser = await db.user.findUnique({
    where: { email: normalizeEmail(demoEmail) },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      active: true,
      doctorId: true,
      image: true,
    },
  })

  if (!dbUser?.active) return null

  return {
    id: dbUser.id,
    name: dbUser.name ?? "Dr.Teste",
    username: dbUser.name ?? "Dr.Teste",
    email: dbUser.email,
    role: (dbUser.role as UserRoleType | null) ?? fallbackRole,
    doctorId: dbUser.doctorId,
    image: dbUser.image ?? null,
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
        if (demoUser) {
          const demo = resolvedDemoCredentials()
          if (demo) {
            const linked = await resolvePortfolioDemoUser(demo.email, demoUser.role)
            if (linked) return linked
          }
          return demoUser
        }

        const user = await db.user.findUnique({
          where: { email: credentials.email },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            password: true,
            active: true,
            doctorId: true,
            image: true,
          },
        })

        if (!user || !user.password) return null
        if (!user.active) return null

        const passwordMatch = await compare(credentials.password, user.password)
        if (!passwordMatch) return null

        return {
          id: user.id,
          name: user.name ?? user.email ?? user.id,
          username: user.name,
          email: user.email,
          role: user.role as UserRoleType | null,
          doctorId: user.doctorId,
          image: user.image ?? null,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id
        token.username = user.username ?? user.name ?? null
        token.role = user.role ?? null
        token.doctorId = user.doctorId ?? null
        token.image = user.image ?? null
      }
      if (trigger === "update") {
        const userId = typeof token.id === "string" ? token.id : undefined
        if (userId) {
          const snapshot = await loadTokenUserSnapshot(userId)
          if (snapshot) {
            applyTokenUserSnapshot(token as Record<string, unknown>, snapshot)
          }
        } else if (session && "image" in session) {
          token.image = (session as { image?: string | null }).image ?? null
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id ?? ""
        session.user.username = token.username ?? null
        session.user.role = token.role as UserRoleType | null ?? null
        session.user.name = token.username ?? session.user.name ?? null
        session.user.doctorId = token.doctorId ?? null
        session.user.image = token.image ?? null
      }
      return session
    },
  },
}
