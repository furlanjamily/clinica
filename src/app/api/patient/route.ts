import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireSession } from "@/lib/auth/api-guard"
import { handleApiError } from "@/lib/errors/error-handler"
import { parseWith } from "@/lib/validations/parse"
import {
  CreatePatientSchema,
  UpdatePatientSchema,
  DeletePatientSchema,
} from "@/lib/validations/patient"

export async function GET() {
  try {
    await requireSession()
    const patients = await db.patient.findMany({ orderBy: { name: "asc" } })
    return NextResponse.json(patients)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(req: Request) {
  try {
    await requireSession()
    const data = parseWith(CreatePatientSchema, await req.json())
    const patient = await db.patient.create({ data })
    return NextResponse.json(patient, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PATCH(req: Request) {
  try {
    await requireSession()
    const { id, ...data } = parseWith(UpdatePatientSchema, await req.json())
    const patient = await db.patient.update({ where: { id }, data })
    return NextResponse.json(patient)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(req: Request) {
  try {
    await requireSession()
    const { id } = parseWith(DeletePatientSchema, await req.json())
    await db.patient.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}
