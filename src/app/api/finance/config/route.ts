import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireSession } from "@/lib/auth/api-guard"
import { handleApiError } from "@/lib/errors/error-handler"
import { parseWith } from "@/lib/validations/parse"
import { UpdateFinancialConfigSchema } from "@/lib/validations/financial-config"
import { DEFAULT_FINANCIAL_CONFIG } from "@/lib/finance/config"

async function getOrCreateConfig() {
  const config = await db.financialConfig.findFirst()
  if (config) return config
  return db.financialConfig.create({ data: DEFAULT_FINANCIAL_CONFIG })
}

export async function GET() {
  try {
    await requireSession()
    const config = await getOrCreateConfig()
    return NextResponse.json(config)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PATCH(req: Request) {
  try {
    await requireSession()
    const data = parseWith(UpdateFinancialConfigSchema, await req.json())

    const current = await getOrCreateConfig()
    const config = await db.financialConfig.update({
      where: { id: current.id },
      data,
    })

    return NextResponse.json(config)
  } catch (error) {
    return handleApiError(error)
  }
}
