const { PrismaClient } = require("@prisma/client")
const { hashSync } = require("bcrypt")

const db = new PrismaClient()

async function main() {
  const user = await db.user.upsert({
    where: { email: "admin@clinica.com" },
    update: {},
    create: {
      username: "Super Admin",
      email: "admin@clinica.com",
      password: hashSync("admin123456", 10),
      role: "SUPER_ADMIN",
    },
  })
  console.log("Super admin pronto:", user.email)
}

main().finally(() => db.$disconnect())
