import { NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { createApiGuard } from "@/lib/api/rate-limit"
import { handleApiError } from "@/lib/errors/error-handler"
import { parseWith } from "@/lib/validations/parse"
import { CreatePatientSchema } from "@/lib/validations/patient"
import { patientInputToDb, toPatientDTO } from "@/lib/domain/patient-dto"
import type { Prisma } from "@/generated/prisma/client"

const guard = createApiGuard({ max: 10, secretEnv: "SCHEDULE_OPTIONS_SECRET" })

const PaginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).catch(50),
  offset: z.coerce.number().int().min(0).catch(0),
})

export async function GET(req: Request) {
  const check = guard(req)
  if (!check.ok) return check.response

  try {
    const url = new URL(req.url)
    const { limit, offset } = PaginationSchema.parse({
      limit: url.searchParams.get("limit") ?? undefined,
      offset: url.searchParams.get("offset") ?? undefined,
    })

    const [doctorsRaw, patients] = await Promise.all([
      db.doctor.findMany({
        where: { active: true },
        orderBy: { name: "asc" },
        take: limit,
        skip: offset,
      }),
      db.patient.findMany({
        orderBy: { name: "asc" },
        take: limit,
        skip: offset,
      }),
    ])

    const doctors = doctorsRaw.map((m) => ({ id: m.id, name: m.name, shift: m.shift }))
    return NextResponse.json({ doctors, patients: patients.map(toPatientDTO) })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(req: Request) {
  const check = guard(req)
  if (!check.ok) return check.response

  try {
    const data = parseWith(CreatePatientSchema, await req.json())
    const created = await db.patient.create({
      data: patientInputToDb(data) as Prisma.PatientCreateInput,
    })
    return NextResponse.json(toPatientDTO(created), { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
