/**
 * Cria/atualiza apenas o usuário demo do portfólio (demo@clinica.local).
 * Use quando o seed completo falhar ou não for necessário.
 */
import "dotenv/config"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"
import { hashSync } from "bcrypt"
import { PrismaClient } from "../src/generated/prisma/client"

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL não definido.")
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })

async function main() {
  const email =
    process.env.DEMO_LOGIN_EMAIL?.trim().toLowerCase() || "demo@clinica.local"
  const password =
    process.env.DEMO_LOGIN_PASSWORD?.trim() || "demo123456"

  const user = await prisma.user.upsert({
    where: { email },
    create: {
      name: "Dr.Teste",
      email,
      password: hashSync(password, 10),
      role: "SUPER_ADMIN",
      active: true,
    },
    update: {
      name: "Dr.Teste",
      role: "SUPER_ADMIN",
      active: true,
      password: hashSync(password, 10),
    },
  })

  console.log(`Usuário demo pronto: ${user.email} (id: ${user.id})`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
