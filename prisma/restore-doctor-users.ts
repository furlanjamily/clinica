import "dotenv/config"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"
import { hashSync } from "bcrypt"
import { PrismaClient } from "../src/generated/prisma/client"

const DEFAULT_DOCTOR_PASSWORD = "Medico123!"

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })

async function main() {
  const doctors = await prisma.doctor.findMany({
    where: { deletedAt: null },
    orderBy: { id: "asc" },
    select: { id: true, name: true, email: true },
  })

  if (doctors.length === 0) {
    console.error("Nenhum médico ativo no banco. Rode npm run db:seed primeiro.")
    process.exit(1)
  }

  const doctorPasswordHash = hashSync(DEFAULT_DOCTOR_PASSWORD, 10)
  let created = 0
  let updated = 0

  for (let i = 0; i < doctors.length; i++) {
    const doctor = doctors[i]
    const email = doctor.email ?? `medico.${i + 1}@clinicademo.local`
    const role = i === 0 ? "SUPER_ADMIN" : "MEDICO"

    const existing = await prisma.user.findUnique({ where: { email } })
    await prisma.user.upsert({
      where: { email },
      create: {
        name: doctor.name,
        email,
        password: doctorPasswordHash,
        role,
        active: true,
        doctorId: doctor.id,
      },
      update: {
        name: doctor.name,
        role,
        active: true,
        doctorId: doctor.id,
        password: doctorPasswordHash,
      },
    })

    if (existing) updated++
    else created++
    console.log(`${existing ? "Atualizado" : "Criado"}: ${email} (${role}) → ${doctor.name}`)
  }

  console.log(`\nConcluído: ${created} criado(s), ${updated} atualizado(s).`)
  console.log(`Senha de todos: ${DEFAULT_DOCTOR_PASSWORD}`)
  console.log(`Super Admin: medico.1@clinicademo.local (Dr.Teste)`)
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
