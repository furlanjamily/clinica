import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET() {
  const records = await prisma.prontuario.findMany({
    include: {
      paciente: true,
      agendamento: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  return NextResponse.json(records)
}

export async function POST(req: Request) {
  const body = await req.json()

  const agendamento = await prisma.agendamento.findUnique({
    where: { id: body.agendamentoId },
    include: { paciente: true },
  })

  if (!agendamento) {
    return NextResponse.json({ error: "Agendamento não encontrado" }, { status: 404 })
  }

  const prontuario = await prisma.prontuario.create({
    data: {
      agendamentoId: body.agendamentoId,
      pacienteId: agendamento.pacienteId,
      patient: agendamento.pacienteNome,

      clinicalDiagnosis: body.clinicalDiagnosis,
      diagnosisReactions: body.diagnosisReactions,
      emotionalState: body.emotionalState,
      personalHistory: body.personalHistory,
      psychicExam: body.psychicExam,
      psychologicalConduct: body.psychologicalConduct,
      familyGuidance: body.familyGuidance,
    },
    include: {
      paciente: true,
      agendamento: true,
    },
  })

  return Response.json(prontuario)
}

export async function PATCH(req: Request) {
  const body = await req.json()
  const prontuario = await prisma.prontuario.update({
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
      paciente: true,
      agendamento: true,
    },
  })

  return Response.json(prontuario)
}

export async function DELETE(req: Request) {
  const body = await req.json()

  await prisma.prontuario.delete({
    where: { id: body.id },
  })

  return NextResponse.json({ ok: true })
}