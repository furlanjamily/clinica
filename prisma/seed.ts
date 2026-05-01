import { PrismaClient } from "@prisma/client"
import { hashSync } from "bcrypt"

const db = new PrismaClient()

async function main() {
  const existing = await db.user.findUnique({ where: { email: "admin@clinica.com" } })
  if (existing) {
    console.log("Super admin já existe.")
    return
  }

  await db.user.create({
    data: {
      name: "Super Admin",
      email: "admin@clinica.com",
      password: hashSync("admin123456", 10),
      role: "SUPER_ADMIN",
    },
  })

  console.log("Super admin criado: admin@clinica.com / admin123456")
}

main().finally(() => db.$disconnect())
