import "dotenv/config"
import { defineConfig } from "prisma/config"

/** URL usada pelo CLI (migrate, db pull). Preferir `DIRECT_URL` com Supabase/pooler. */
const databaseUrl = process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? ""

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: databaseUrl,
  },
})
