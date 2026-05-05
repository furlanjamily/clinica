import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"
import { PrismaClient } from "@/generated/prisma/client"

const connectionString = process.env.DATABASE_URL

function createPrisma() {
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set")
  }
  const pool = new Pool({ connectionString })
  const adapter = new PrismaPg(pool)
  return new PrismaClient({ adapter })
}

const prismaClientSingleton = () => createPrisma()

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>
} & typeof global

export const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

if (process.env.NODE_ENV !== "production") globalThis.prismaGlobal = prisma

export const db = prisma
