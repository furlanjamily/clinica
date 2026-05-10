import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET() {
  const patients = await db.patient.findMany({ orderBy: { name: "asc" } })
  return NextResponse.json(patients)
}

export async function POST(req: Request) {
  const body = await req.json()
  const patient = await db.patient.create({ data: body })
  return NextResponse.json(patient, { status: 201 })
}

export async function PATCH(req: Request) {
  const { id, ...data } = await req.json()
  const patient = await db.patient.update({ where: { id }, data })
  return NextResponse.json(patient)
}

export async function DELETE(req: Request) {
  const { id } = await req.json()
  await db.patient.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
