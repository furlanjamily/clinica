import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

async function checkPermission() {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role
  return role === "SUPER_ADMIN" || role === "ADMIN"
}

export async function GET() {
  try {
    const medicos = await db.medico.findMany({
      orderBy: { nome: "asc" },
    })

    return NextResponse.json(medicos)
  } catch (error) {
    console.error("ERROR MEDICOS:", error)

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  if (!await checkPermission()) return NextResponse.json({ message: "Sem permissão" }, { status: 403 })
  const body = await req.json()
  const medico = await db.medico.create({ data: body })
  return NextResponse.json(medico)
}

export async function PATCH(req: Request) {
  if (!await checkPermission()) return NextResponse.json({ message: "Sem permissão" }, { status: 403 })
  const { id, ...data } = await req.json()
  const medico = await db.medico.update({ where: { id }, data })
  return NextResponse.json(medico)
}

export async function DELETE(req: Request) {
  if (!await checkPermission()) return NextResponse.json({ message: "Sem permissão" }, { status: 403 })
  const { id } = await req.json()
  await db.medico.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
