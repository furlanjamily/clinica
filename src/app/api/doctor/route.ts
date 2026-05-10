import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

async function checkPermission() {
  const session = await getServerSession(authOptions)
  const role = (session?.user as { role?: string })?.role
  return role === "SUPER_ADMIN" || role === "ADMIN"
}

export async function GET() {
  try {
    const doctors = await db.doctor.findMany({
      orderBy: { name: "asc" },
    })

    return NextResponse.json(doctors)
  } catch (error) {
    console.error("ERROR DOCTORS:", error)

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  if (!(await checkPermission())) return NextResponse.json({ message: "Sem permissão" }, { status: 403 })
  const body = await req.json()
  const doctor = await db.doctor.create({ data: body })
  return NextResponse.json(doctor)
}

export async function PATCH(req: Request) {
  if (!(await checkPermission())) return NextResponse.json({ message: "Sem permissão" }, { status: 403 })
  const { id, ...data } = await req.json()
  const doctor = await db.doctor.update({ where: { id }, data })
  return NextResponse.json(doctor)
}

export async function DELETE(req: Request) {
  if (!(await checkPermission())) return NextResponse.json({ message: "Sem permissão" }, { status: 403 })
  const { id } = await req.json()
  await db.doctor.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
