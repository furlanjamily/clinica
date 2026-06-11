import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { mapClinicalChartFromDb } from "@/lib/medical-record/map-prontuario"
import { requireSession } from "@/lib/auth/api-guard"
import { handleApiError } from "@/lib/errors/error-handler"
import { NotFoundError } from "@/lib/errors/custom-errors"
import { parseWith } from "@/lib/validations/parse"
import {
  CreateMedicalRecordSchema,
  UpdateMedicalRecordSchema,
  DeleteMedicalRecordSchema,
} from "@/lib/validations/medical-record"

const appointmentSelect = {
  id: true,
  date: true,
  slotTime: true,
  professionalName: true,
  patientName: true,
  patientId: true,
} as const

const chartInclude = {
  patient: true,
  appointment: { select: appointmentSelect },
} as const

export async function GET() {
  try {
    await requireSession()
    const records = await prisma.clinicalChart.findMany({
      include: chartInclude,
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(
      records.map((r) => mapClinicalChartFromDb(r as Record<string, unknown>))
    )
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(req: Request) {
  try {
    await requireSession()
    const { appointmentId, ...chartData } = parseWith(
      CreateMedicalRecordSchema,
      await req.json()
    )

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { patient: true },
    })

    if (!appointment) {
      throw new NotFoundError("Agendamento não encontrado")
    }

    // appointmentId é único: upsert evita erro P2002 quando o prontuário já existe
    const clinicalChart = await prisma.clinicalChart.upsert({
      where: { appointmentId },
      create: {
        appointmentId,
        patientId: appointment.patientId,
        patientLabel: appointment.patientName,
        ...chartData,
      },
      update: chartData,
      include: chartInclude,
    })

    return NextResponse.json(
      mapClinicalChartFromDb(clinicalChart as Record<string, unknown>)
    )
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PATCH(req: Request) {
  try {
    await requireSession()
    const { id, ...chartData } = parseWith(UpdateMedicalRecordSchema, await req.json())

    const clinicalChart = await prisma.clinicalChart.update({
      where: { id },
      data: chartData,
      include: chartInclude,
    })

    return NextResponse.json(
      mapClinicalChartFromDb(clinicalChart as Record<string, unknown>)
    )
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(req: Request) {
  try {
    await requireSession()
    const { id } = parseWith(DeleteMedicalRecordSchema, await req.json())
    await prisma.clinicalChart.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}
