/**
 * Cria/atualiza o usuário demo principal (demo@clinica.local) vinculado ao Dr.Teste.
 */
import "dotenv/config"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"
import { hashSync } from "bcrypt"
import { PrismaClient } from "../src/generated/prisma/client"
import {
  resolvedDemoSuperAdminEmail,
  resolvedDemoSuperAdminPassword,
} from "../src/lib/demo-credentials"

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL não definido.")
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })

async function main() {
  const email = resolvedDemoSuperAdminEmail()
  const password = resolvedDemoSuperAdminPassword()

  const firstDoctor = await prisma.doctor.findFirst({
    where: { deletedAt: null, active: true },
    orderBy: { id: "asc" },
    select: { id: true, name: true },
  })

  if (!firstDoctor) {
    throw new Error("Nenhum médico ativo no banco. Rode npm run db:seed primeiro.")
  }

  await prisma.doctor.update({
    where: { id: firstDoctor.id },
    data: { email },
  })

  const user = await prisma.user.upsert({
    where: { email },
    create: {
      name: firstDoctor.name,
      email,
      password: hashSync(password, 10),
      role: "SUPER_ADMIN",
      doctorId: firstDoctor.id,
      active: true,
    },
    update: {
      name: firstDoctor.name,
      role: "SUPER_ADMIN",
      doctorId: firstDoctor.id,
      active: true,
      password: hashSync(password, 10),
    },
  })

  await prisma.user.updateMany({
    where: { role: "SUPER_ADMIN", email: { not: email } },
    data: { role: "MEDICO" },
  })

  const legacy = await prisma.user.findUnique({
    where: { email: "medico.1@clinicademo.local" },
  })
  if (legacy && legacy.id !== user.id) {
    await prisma.user.delete({ where: { id: legacy.id } })
  }

  console.log(`Usuário demo pronto: ${user.email} → ${firstDoctor.name} (id: ${user.id})`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
