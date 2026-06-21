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
import { patientInputToDb, toPatientDTO } from "@/lib/domain/patient-dto"
import type { Prisma } from "@/generated/prisma/client"

export async function GET() {
  try {
    await requireSession()
    const patients = await db.patient.findMany({
      where: { deletedAt: null },
      orderBy: { name: "asc" },
    })
    return NextResponse.json(patients.map(toPatientDTO))
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(req: Request) {
  try {
    await requireSession()
    const data = parseWith(CreatePatientSchema, await req.json())
    const patient = await db.patient.create({
      data: patientInputToDb(data) as Prisma.PatientCreateInput,
    })
    return NextResponse.json(toPatientDTO(patient), { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PATCH(req: Request) {
  try {
    await requireSession()
    const { id, ...data } = parseWith(UpdatePatientSchema, await req.json())
    const patient = await db.patient.update({ where: { id }, data: patientInputToDb(data) })
    return NextResponse.json(toPatientDTO(patient))
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(req: Request) {
  try {
    await requireSession()
    const { id } = parseWith(DeletePatientSchema, await req.json())
    // Soft delete: preserva histórico clínico/financeiro (FKs Restrict).
    await db.patient.update({ where: { id }, data: { deletedAt: new Date() } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}
