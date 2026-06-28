/**
 * Consolida a conta demo: demo@clinica.local vira o único SUPER_ADMIN (Dr.Teste).
 * Use após atualizar o código sem rodar o seed completo.
 */
import "dotenv/config"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"
import { hashSync } from "bcrypt"
import { PrismaClient } from "../src/generated/prisma/client"
import {
  DEFAULT_DOCTOR_USER_PASSWORD,
  resolvedDemoSuperAdminEmail,
  resolvedDemoSuperAdminPassword,
} from "../src/lib/demo-credentials"

const LEGACY_SUPER_ADMIN_EMAIL = "medico.1@clinicademo.local"

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })

async function main() {
  const demoEmail = resolvedDemoSuperAdminEmail()
  const demoPasswordHash = hashSync(resolvedDemoSuperAdminPassword(), 10)
  const doctorPasswordHash = hashSync(DEFAULT_DOCTOR_USER_PASSWORD, 10)

  const firstDoctor = await prisma.doctor.findFirst({
    where: { deletedAt: null, active: true },
    orderBy: { id: "asc" },
  })

  if (!firstDoctor) {
    throw new Error("Nenhum médico ativo encontrado. Rode npm run db:seed primeiro.")
  }

  await prisma.doctor.update({
    where: { id: firstDoctor.id },
    data: { email: demoEmail },
  })

  const [legacyUser, demoUser] = await Promise.all([
    prisma.user.findUnique({ where: { email: LEGACY_SUPER_ADMIN_EMAIL } }),
    prisma.user.findUnique({ where: { email: demoEmail } }),
  ])

  if (legacyUser && demoUser && legacyUser.id !== demoUser.id) {
    await prisma.user.update({
      where: { id: demoUser.id },
      data: {
        name: firstDoctor.name,
        role: "SUPER_ADMIN",
        doctorId: firstDoctor.id,
        active: true,
        password: demoPasswordHash,
      },
    })
    await prisma.user.delete({ where: { id: legacyUser.id } })
    console.log(`Removido legado ${LEGACY_SUPER_ADMIN_EMAIL}; mantido ${demoEmail}.`)
  } else if (legacyUser && !demoUser) {
    await prisma.user.update({
      where: { id: legacyUser.id },
      data: {
        email: demoEmail,
        name: firstDoctor.name,
        role: "SUPER_ADMIN",
        doctorId: firstDoctor.id,
        active: true,
        password: demoPasswordHash,
      },
    })
    console.log(`Renomeado ${LEGACY_SUPER_ADMIN_EMAIL} → ${demoEmail}.`)
  } else {
    await prisma.user.upsert({
      where: { email: demoEmail },
      create: {
        name: firstDoctor.name,
        email: demoEmail,
        password: demoPasswordHash,
        role: "SUPER_ADMIN",
        doctorId: firstDoctor.id,
        active: true,
      },
      update: {
        name: firstDoctor.name,
        role: "SUPER_ADMIN",
        doctorId: firstDoctor.id,
        active: true,
        password: demoPasswordHash,
      },
    })
    console.log(`Garantido SUPER_ADMIN: ${demoEmail}.`)
  }

  const doctors = await prisma.doctor.findMany({
    where: { deletedAt: null, active: true },
    orderBy: { id: "asc" },
  })

  for (let i = 1; i < doctors.length; i++) {
    const doctor = doctors[i]
    const email = doctor.email ?? `medico.${i + 1}@clinicademo.local`

    await prisma.user.upsert({
      where: { email },
      create: {
        name: doctor.name,
        email,
        password: doctorPasswordHash,
        role: "MEDICO",
        doctorId: doctor.id,
        active: true,
      },
      update: {
        name: doctor.name,
        role: "MEDICO",
        doctorId: doctor.id,
        active: true,
      },
    })
  }

  const demoted = await prisma.user.updateMany({
    where: { role: "SUPER_ADMIN", email: { not: demoEmail } },
    data: { role: "MEDICO" },
  })

  console.log(`Médico vinculado: ${firstDoctor.name} (id ${firstDoctor.id})`)
  console.log(`Login: ${demoEmail} / ${resolvedDemoSuperAdminPassword()}`)
  if (demoted.count > 0) {
    console.log(`Rebaixados ${demoted.count} SUPER_ADMIN extra(s) para MEDICO.`)
  }
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
