import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET() {
  let config = await db.configuracaoFinanceira.findFirst()
  if (!config) {
    config = await db.configuracaoFinanceira.create({
      data: { valorConsulta: 150, valorRetorno: 80, comissaoMedico: 40 },
    })
  }
  return NextResponse.json(config)
}

export async function PATCH(req: Request) {
  const body = await req.json()
  let config = await db.configuracaoFinanceira.findFirst()
  if (!config) {
    config = await db.configuracaoFinanceira.create({ data: body })
  } else {
    config = await db.configuracaoFinanceira.update({ where: { id: config.id }, data: body })
  }
  return NextResponse.json(config)
}
