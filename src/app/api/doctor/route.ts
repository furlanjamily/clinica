import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireRole, requireSession } from "@/lib/auth/api-guard"
import { handleApiError } from "@/lib/errors/error-handler"
import { parseWith } from "@/lib/validations/parse"
import {
  CreateDoctorSchema,
  UpdateDoctorSchema,
  DeleteDoctorSchema,
} from "@/lib/validations/doctor"

export async function GET() {
  try {
    await requireSession()
    const doctors = await db.doctor.findMany({ orderBy: { name: "asc" } })
    return NextResponse.json(doctors)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(req: Request) {
  try {
    await requireRole("ADMIN", "SUPER_ADMIN")
    const data = parseWith(CreateDoctorSchema, await req.json())
    const doctor = await db.doctor.create({ data })
    return NextResponse.json(doctor, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PATCH(req: Request) {
  try {
    await requireRole("ADMIN", "SUPER_ADMIN")
    const { id, ...data } = parseWith(UpdateDoctorSchema, await req.json())
    const doctor = await db.doctor.update({ where: { id }, data })
    return NextResponse.json(doctor)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(req: Request) {
  try {
    await requireRole("ADMIN", "SUPER_ADMIN")
    const { id } = parseWith(DeleteDoctorSchema, await req.json())
    await db.doctor.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}
