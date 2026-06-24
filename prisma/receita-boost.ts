// Insere receitas demo extras sem apagar o restante do banco.
import "dotenv/config"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"
import { PrismaClient } from "../src/generated/prisma/client"
import { buildExtraReceitaSeed } from "./finance-demo-data"

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL não definido. Configure o .env antes de rodar o seed de receitas.")
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })

async function main() {
  const txs = buildExtraReceitaSeed(new Date())
  const { count } = await prisma.transaction.createMany({ data: txs })

  console.log(`Inseridas ${count} receitas demo.`)
  console.log("Recarregue a página Financeiro para ver os novos dados.")
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
