import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { compare } from "bcrypt";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "./db";
import type { UserRoleType } from "@/types/auth";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db as Parameters<typeof PrismaAdapter>[0]),
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
