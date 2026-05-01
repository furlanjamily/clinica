import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const mes = searchParams.get("mes") // YYYY-MM
  const tipo = searchParams.get("tipo") // Receita | Despesa

  const where: any = {}
  if (mes) where.data = { startsWith: mes }
  if (tipo) where.tipo = tipo

  const transacoes = await db.transacao.findMany({
    where,
    orderBy: { data: "desc" },
    include: { agendamento: true },
  })
  return NextResponse.json(transacoes)
}

export async function POST(req: Request) {
  const body = await req.json()
  const transacao = await db.transacao.create({ data: body })
  return NextResponse.json(transacao, { status: 201 })
}

export async function PATCH(req: Request) {
  const { id, ...data } = await req.json()
  const transacao = await db.transacao.update({ where: { id }, data })
  return NextResponse.json(transacao)
}

export async function DELETE(req: Request) {
  const { id } = await req.json()
  await db.transacao.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
