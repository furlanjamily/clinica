import { NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { findAgendamentoConflict } from "@/lib/schedule/conflicts"
import { toAppointment } from "@/lib/schedule/map-atendimento"
import { CreateAppointmentSchema } from "@/lib/validations/schedule"
import { handleApiError } from "@/lib/errors/error-handler"
import { ValidationError, ConflictError } from "@/lib/errors/custom-errors"

export type { Appointment as Atendimento } from "@/lib/schedule/types"

/* =========================
   RATE LIMIT
========================= */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_WINDOW = 60 * 1000
const RATE_LIMIT_MAX = 50

function getClientIp(req: Request) {
  const forwarded = req.headers.get("x-forwarded-for") ?? ""
  return forwarded.split(",")[0] ?? "unknown"
}

function rateLimit(ip: string) {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return false
  }

  if (entry.count >= RATE_LIMIT_MAX) return true

  entry.count++
  return false
}

/* =========================
   AUTH
========================= */
function isAuthorized(req: Request) {
  const secret = process.env.SCHEDULE_API_SECRET?.trim()
  if (!secret) return true

  const auth = req.headers.get("authorization") ?? ""
  return auth === `Bearer ${secret}`
}

/* =========================
   GET
========================= */
export async function GET(req: Request) {
  try {
    const ip = getClientIp(req)
    if (rateLimit(ip)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 })
    }

    if (!isAuthorized(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const [agendamentos, medicos, pacientes] = await Promise.all([
      db.agendamento.findMany({
        select: {
          id: true,
          data: true,
          horario: true,
          status: true,
          pacienteId: true,
          medicoId: true,
          startTime: true,
          endTime: true,
          pausedAt: true,
          accumulatedTime: true,
          paciente: {
            select: {
              id: true,
              nome: true,
              telefone: true,
            },
          },
          medico: {
            select: {
              id: true,
              nome: true,
            },
          },
          prontuario: {
            select: {
              id: true,
              paciente: {
                select: {
                  id: true,
                  nome: true,
                },
              },
              agendamento: {
                select: {
                  id: true,
                  data: true,
                  horario: true,
                },
              },
            },
          },
          transacao: {
            select: {
              id: true,
              valor: true,
              categoria: true,
              tipo: true,
              status: true,
            },
          },
        },
        orderBy: [{ data: "asc" }, { horario: "asc" }],
      }),
      db.medico.findMany({
        select: {
          id: true,
          nome: true,
        },
        where: { ativo: true },
        orderBy: { nome: "asc" }
      }),
      db.paciente.findMany({
        select: {
          id: true,
          nome: true,
          telefone: true,
        },
        orderBy: { nome: "asc" }
      }),
    ])

    return NextResponse.json({
      agendamentos: agendamentos.map(toAppointment),
      medicos,
      pacientes,
    })
  } catch (err) {
    return handleApiError(err)
  }
}

async function resolvePaciente(pacienteInput: any) {
  if (typeof pacienteInput === "object" && pacienteInput.id) {
    const p = await db.paciente.findUnique({ where: { id: pacienteInput.id } })
    if (!p) throw new ValidationError("Paciente não encontrado")
    return p
  }

  const p = await db.paciente.findFirst({
    where: { nome: String(pacienteInput) },
  })

  if (!p) throw new ValidationError("Paciente não encontrado")
  return p
}

async function resolveMedico(medicoInput: any) {
  if (typeof medicoInput === "object" && medicoInput.id) {
    const m = await db.medico.findUnique({ where: { id: medicoInput.id } })
    if (!m) throw new ValidationError("Médico não encontrado")
    return m
  }

  const m = await db.medico.findFirst({
    where: { nome: String(medicoInput) },
  })

  if (!m) throw new ValidationError("Médico não encontrado")
  return m
}

/* =========================
   POST
========================= */
export async function POST(req: Request) {
  try {
    const ip = getClientIp(req)
    if (rateLimit(ip)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 })
    }

    if (!isAuthorized(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()

    const parsed = CreateAppointmentSchema.safeParse(body)
    if (!parsed.success) {
      throw new ValidationError("Dados inválidos", parsed.error.issues)
    }

    const data = parsed.data

    const paciente = await resolvePaciente(data.paciente)
    const medico = await resolveMedico(data.profissional)

    const telefone = paciente.telefone ?? ""

    const conflito = await findAgendamentoConflict(
      medico.id,
      data.data,
      data.horario
    )

    if (conflito) {
      throw new ConflictError("Horário já ocupado")
    }

    const agendamento = await db.agendamento.create({
      data: {
        data: data.data,
        horario: data.horario,
        status: "Agendado",

        pacienteNome: paciente.nome,
        profissionalNome: medico.nome,
        telefone,

        paciente: { connect: { id: paciente.id } },
        medico: { connect: { id: medico.id } },
      },
      include: {
        paciente: true,
        medico: true,
      },
    })

    return NextResponse.json(toAppointment(agendamento))
  } catch (err) {
    return handleApiError(err)
  }
}

/* =========================
   PATCH (SEM exigir ID no front)
========================= */
export async function PATCH(req: Request) {
  try {
    const body = await req.json()

    if (!body.id) {
      throw new ValidationError("ID obrigatório")
    }

    const atual = await db.agendamento.findUnique({
      where: { id: body.id },
      include: { paciente: true, medico: true },
    })

    if (!atual) {
      throw new ValidationError("Agendamento não encontrado")
    }

    if (body.data || body.horario) {
      const conflito = await findAgendamentoConflict(
        atual.medico.id,
        body.data || atual.data,
        body.horario || atual.horario,
        body.id
      )

      if (conflito) {
        throw new ConflictError("Horário já ocupado")
      }
    }

    if (body.status === "Pago" && atual.status === "RegistrarChegada") {
      const vinculo = await db.transacao.findUnique({ where: { agendamentoId: body.id } })
      if (!vinculo) {
        throw new ValidationError(
          "Para marcar como pago, registre antes a receita vinculada a este agendamento (modal «Confirmar pagamento» na agenda)."
        )
      }
    }

    const updated = await db.agendamento.update({
      where: { id: body.id },
      data: {
        ...(body.data && { data: body.data }),
        ...(body.horario && { horario: body.horario }),
        ...(body.status && { status: body.status }),
        ...(body.startTime !== undefined && { startTime: body.startTime }),
        ...(body.endTime !== undefined && { endTime: body.endTime }),
        ...(body.accumulatedTime !== undefined && { accumulatedTime: body.accumulatedTime }),
        ...(body.pausedAt !== undefined && { pausedAt: body.pausedAt }),
      },
      include: {
        paciente: true,
        medico: true,
        transacao: true,
        prontuario: {
          include: {
            paciente: true,
            agendamento: true,
          },
        },
      },
    })

    return NextResponse.json(toAppointment(updated))
  } catch (err) {
    return handleApiError(err)
  }
}