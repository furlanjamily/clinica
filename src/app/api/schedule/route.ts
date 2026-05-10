import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { findAppointmentConflict } from "@/lib/schedule/conflicts"
import { toAppointment } from "@/lib/schedule/map-appointment"
import { CreateAppointmentSchema } from "@/lib/validations/schedule"
import { handleApiError } from "@/lib/errors/error-handler"
import { ValidationError, ConflictError } from "@/lib/errors/custom-errors"

export type { Appointment } from "@/lib/schedule/types"

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

function isAuthorized(req: Request) {
  const secret = process.env.SCHEDULE_API_SECRET?.trim()
  if (!secret) return true

  const auth = req.headers.get("authorization") ?? ""
  return auth === `Bearer ${secret}`
}

export async function GET(req: Request) {
  try {
    const ip = getClientIp(req)
    if (rateLimit(ip)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 })
    }

    if (!isAuthorized(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const [appointments, doctors, patients] = await Promise.all([
      db.appointment.findMany({
        select: {
          id: true,
          date: true,
          slotTime: true,
          status: true,
          patientId: true,
          doctorId: true,
          startTime: true,
          endTime: true,
          pausedAt: true,
          accumulatedTime: true,
          patient: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
          doctor: {
            select: {
              id: true,
              name: true,
            },
          },
          clinicalChart: {
            include: {
              patient: true,
              appointment: {
                select: {
                  id: true,
                  date: true,
                  slotTime: true,
                  professionalName: true,
                  patientName: true,
                  patientId: true,
                },
              },
            },
          },
          transaction: {
            select: {
              id: true,
              amount: true,
              category: true,
              type: true,
              status: true,
            },
          },
        },
        orderBy: [{ date: "asc" }, { slotTime: "asc" }],
      }),
      db.doctor.findMany({
        select: {
          id: true,
          name: true,
        },
        where: { active: true },
        orderBy: { name: "asc" },
      }),
      db.patient.findMany({
        select: {
          id: true,
          name: true,
          phone: true,
        },
        orderBy: { name: "asc" },
      }),
    ])

    return NextResponse.json({
      appointments: appointments.map(toAppointment),
      doctors,
      patients,
    })
  } catch (err) {
    return handleApiError(err)
  }
}

async function resolvePatient(patientInput: { id?: number; name?: string } | string) {
  if (typeof patientInput === "object" && patientInput.id) {
    const p = await db.patient.findUnique({ where: { id: patientInput.id } })
    if (!p) throw new ValidationError("Paciente não encontrado")
    return p
  }

  const p = await db.patient.findFirst({
    where: { name: String(patientInput) },
  })

  if (!p) throw new ValidationError("Paciente não encontrado")
  return p
}

async function resolveDoctor(doctorInput: { id?: number; name?: string } | string) {
  if (typeof doctorInput === "object" && doctorInput.id) {
    const m = await db.doctor.findUnique({ where: { id: doctorInput.id } })
    if (!m) throw new ValidationError("Médico não encontrado")
    return m
  }

  const m = await db.doctor.findFirst({
    where: { name: String(doctorInput) },
  })

  if (!m) throw new ValidationError("Médico não encontrado")
  return m
}

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

    const patient = await resolvePatient(data.patient)
    const doctor = await resolveDoctor(data.professional)

    const phone = patient.phone ?? ""

    const conflict = await findAppointmentConflict(
      doctor.id,
      data.date,
      data.slotTime
    )

    if (conflict) {
      throw new ConflictError("Horário já ocupado")
    }

    const appointment = await db.appointment.create({
      data: {
        date: data.date,
        slotTime: data.slotTime,
        status: "Agendado",

        patientName: patient.name,
        professionalName: doctor.name,
        phone,

        patient: { connect: { id: patient.id } },
        doctor: { connect: { id: doctor.id } },
      },
      include: {
        patient: true,
        doctor: true,
      },
    })

    return NextResponse.json(toAppointment(appointment))
  } catch (err) {
    return handleApiError(err)
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json()

    if (!body.id) {
      throw new ValidationError("ID obrigatório")
    }

    const current = await db.appointment.findUnique({
      where: { id: body.id },
      include: { patient: true, doctor: true },
    })

    if (!current) {
      throw new ValidationError("Agendamento não encontrado")
    }

    if (body.date || body.slotTime || body.data || body.horario) {
      const nextDate = body.date ?? body.data ?? current.date
      const nextSlot = body.slotTime ?? body.horario ?? current.slotTime
      const conflict = await findAppointmentConflict(
        current.doctor.id,
        nextDate,
        nextSlot,
        body.id
      )

      if (conflict) {
        throw new ConflictError("Horário já ocupado")
      }
    }

    if (body.status === "Pago" && current.status === "RegistrarChegada") {
      const linked = await db.transaction.findUnique({
        where: { appointmentId: body.id },
      })
      if (!linked) {
        throw new ValidationError(
          "Para marcar como pago, registre antes a receita vinculada a este agendamento (modal «Confirmar pagamento» na agenda)."
        )
      }
    }

    const updated = await db.appointment.update({
      where: { id: body.id },
      data: {
        ...(body.date || body.data
          ? { date: (body.date ?? body.data) as string }
          : {}),
        ...(body.slotTime || body.horario
          ? { slotTime: (body.slotTime ?? body.horario) as string }
          : {}),
        ...(body.status && { status: body.status }),
        ...(body.startTime !== undefined && { startTime: body.startTime }),
        ...(body.endTime !== undefined && { endTime: body.endTime }),
        ...(body.accumulatedTime !== undefined && { accumulatedTime: body.accumulatedTime }),
        ...(body.pausedAt !== undefined && { pausedAt: body.pausedAt }),
      },
      include: {
        patient: true,
        doctor: true,
        transaction: true,
        clinicalChart: {
          include: {
            patient: true,
            appointment: true,
          },
        },
      },
    })

    return NextResponse.json(toAppointment(updated))
  } catch (err) {
    return handleApiError(err)
  }
}
