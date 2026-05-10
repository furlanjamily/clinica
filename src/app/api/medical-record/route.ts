import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"
import { mapClinicalChartFromDb } from "@/lib/medical-record/map-prontuario"

const appointmentSelect = {
  id: true,
  date: true,
  slotTime: true,
  professionalName: true,
  patientName: true,
  patientId: true,
} as const

export async function GET() {
  const records = await prisma.clinicalChart.findMany({
    include: {
      patient: true,
      appointment: {
        select: appointmentSelect,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  return NextResponse.json(records.map((r) => mapClinicalChartFromDb(r as Record<string, unknown>)))
}

export async function POST(req: Request) {
  const body = await req.json()

  const appointment = await prisma.appointment.findUnique({
    where: { id: body.appointmentId },
    include: { patient: true },
  })

  if (!appointment) {
    return NextResponse.json({ error: "Agendamento não encontrado" }, { status: 404 })
  }

  const clinicalChart = await prisma.clinicalChart.create({
    data: {
      appointmentId: body.appointmentId,
      patientId: appointment.patientId,
      patientLabel: appointment.patientName,

      clinicalDiagnosis: body.clinicalDiagnosis,
      diagnosisReactions: body.diagnosisReactions,
      emotionalState: body.emotionalState,
      personalHistory: body.personalHistory,
      psychicExam: body.psychicExam,
      psychologicalConduct: body.psychologicalConduct,
      familyGuidance: body.familyGuidance,
    },
    include: {
      patient: true,
      appointment: {
        select: appointmentSelect,
      },
    },
  })

  return Response.json(mapClinicalChartFromDb(clinicalChart as Record<string, unknown>))
}

export async function PATCH(req: Request) {
  const body = await req.json()
  const clinicalChart = await prisma.clinicalChart.update({
    where: { id: body.id },
    data: {
      clinicalDiagnosis: body.clinicalDiagnosis,
      diagnosisReactions: body.diagnosisReactions,
      emotionalState: body.emotionalState,
      personalHistory: body.personalHistory,
      psychicExam: body.psychicExam,
      psychologicalConduct: body.psychologicalConduct,
      familyGuidance: body.familyGuidance,
    },
    include: {
      patient: true,
      appointment: {
        select: appointmentSelect,
      },
    },
  })

  return Response.json(mapClinicalChartFromDb(clinicalChart as Record<string, unknown>))
}

export async function DELETE(req: Request) {
  const body = await req.json()

  await prisma.clinicalChart.delete({
    where: { id: body.id },
  })

  return NextResponse.json({ ok: true })
}
