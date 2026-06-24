// Insere lançamentos financeiros demo sem apagar o restante do banco.
import "dotenv/config"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"
import { PrismaClient } from "../src/generated/prisma/client"
import { buildStandaloneFinanceSeed } from "./finance-demo-data"

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL não definido. Configure o .env antes de rodar o seed financeiro.")
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })

async function main() {
  const txs = buildStandaloneFinanceSeed(new Date())
  const { count } = await prisma.transaction.createMany({ data: txs })

  console.log(`Inseridos ${count} lançamentos financeiros avulsos (demo).`)
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
