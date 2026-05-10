import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET() {
  let config = await db.financialConfig.findFirst()
  if (!config) {
    config = await db.financialConfig.create({
      data: { consultationFee: 150, followUpFee: 80, doctorCommissionRate: 40 },
    })
  }
  return NextResponse.json(config)
}

export async function PATCH(req: Request) {
  const body = await req.json()
  let config = await db.financialConfig.findFirst()
  if (!config) {
    config = await db.financialConfig.create({ data: body })
  } else {
    config = await db.financialConfig.update({ where: { id: config.id }, data: body })
  }
  return NextResponse.json(config)
}
