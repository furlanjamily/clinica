import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET() {
  const pacientes = await db.paciente.findMany({ orderBy: { nome: "asc" } })
  return NextResponse.json(pacientes)
}

export async function POST(req: Request) {
  const body = await req.json()
  const paciente = await db.paciente.create({ data: body })
  return NextResponse.json(paciente, { status: 201 })
}

export async function PATCH(req: Request) {
  const { id, ...data } = await req.json()
  const paciente = await db.paciente.update({ where: { id }, data })
  return NextResponse.json(paciente)
}

export async function DELETE(req: Request) {
  const { id } = await req.json()
  await db.paciente.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
