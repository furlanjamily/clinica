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

  const demoEmail = resolvedDemoSuperAdminEmail()
  const doctorPasswordHash = hashSync(DEFAULT_DOCTOR_USER_PASSWORD, 10)
  const demoPasswordHash = hashSync(resolvedDemoSuperAdminPassword(), 10)
  let created = 0
  let updated = 0

  for (let i = 0; i < doctors.length; i++) {
    const doctor = doctors[i]
    const isSuperAdmin = i === 0
    const email = isSuperAdmin
      ? demoEmail
      : (doctor.email ?? `medico.${i + 1}@clinicademo.local`)

    if (isSuperAdmin) {
      await prisma.doctor.update({
        where: { id: doctor.id },
        data: { email: demoEmail },
      })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    await prisma.user.upsert({
      where: { email },
      create: {
        name: doctor.name,
        email,
        password: isSuperAdmin ? demoPasswordHash : doctorPasswordHash,
        role: isSuperAdmin ? "SUPER_ADMIN" : "MEDICO",
        active: true,
        doctorId: doctor.id,
      },
      update: {
        name: doctor.name,
        role: isSuperAdmin ? "SUPER_ADMIN" : "MEDICO",
        active: true,
        doctorId: doctor.id,
        password: isSuperAdmin ? demoPasswordHash : doctorPasswordHash,
      },
    })

    if (existing) updated++
    else created++
    console.log(`${existing ? "Atualizado" : "Criado"}: ${email} (${isSuperAdmin ? "SUPER_ADMIN" : "MEDICO"}) → ${doctor.name}`)
  }

  await prisma.user.updateMany({
    where: { role: "SUPER_ADMIN", email: { not: demoEmail } },
    data: { role: "MEDICO" },
  })

  const legacy = await prisma.user.findUnique({
    where: { email: "medico.1@clinicademo.local" },
  })
  if (legacy) {
    await prisma.user.delete({ where: { id: legacy.id } })
    console.log("Removido legado: medico.1@clinicademo.local")
  }

  console.log(`\nConcluído: ${created} criado(s), ${updated} atualizado(s).`)
  console.log(`Super Admin: ${demoEmail} / ${resolvedDemoSuperAdminPassword()}`)
  console.log(`Demais médicos: medico.N@clinicademo.local / ${DEFAULT_DOCTOR_USER_PASSWORD}`)
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
