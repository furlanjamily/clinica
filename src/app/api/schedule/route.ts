import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { db } from "@/lib/db"
import { authOptions } from "@/lib/auth"
import { requireSession } from "@/lib/auth/api-guard"
import { resolveAppointmentDoctorFilter } from "@/lib/auth/appointment-scope"
import { findAppointmentConflict } from "@/lib/schedule/conflicts"
import { toAppointment } from "@/lib/schedule/map-appointment"
import { CreateAppointmentSchema, UpdateAppointmentSchema } from "@/lib/validations/schedule"
import { parseWith } from "@/lib/validations/parse"
import { handleApiError } from "@/lib/errors/error-handler"
import { ValidationError, ConflictError, NotFoundError, ForbiddenError } from "@/lib/errors/custom-errors"
import { createApiGuard } from "@/lib/api/rate-limit"
import { AppointmentStatus } from "@/lib/schedule/status"
import { combineLocalDateTime, toLocalDate, toLocalSlotTime } from "@/lib/datetime/appointment-time"
import { notifyAppointmentAssigned, resolveUserIdsByDoctorId } from "@/lib/notification/triggers"

export type { Appointment } from "@/lib/schedule/types"

const nestedAppointmentSelect = {
  id: true,
  scheduledStart: true,
  professionalNameSnapshot: true,
  patientNameSnapshot: true,
  patientId: true,
} as const

const guard = createApiGuard({ max: 50, secretEnv: "SCHEDULE_API_SECRET" })

export async function GET(req: Request) {
  try {
    const check = guard(req)
    if (!check.ok) return check.response

    const session = await getServerSession(authOptions)
    const doctorFilter = session ? await resolveAppointmentDoctorFilter(session) : undefined
    const appointmentWhere =
      doctorFilter !== undefined ? { doctorId: doctorFilter } : undefined

    const [appointments, doctors, patients] = await Promise.all([
      db.appointment.findMany({
        where: appointmentWhere,
        select: {
          id: true,
          scheduledStart: true,
          status: true,
          patientId: true,
          doctorId: true,
          patientNameSnapshot: true,
          professionalNameSnapshot: true,
          startedAt: true,
          endedAt: true,
          pausedAt: true,
          accumulatedMs: true,
          patient: {
            select: {
              id: true,
              name: true,
              phone: true,
              image: true,
            },
          },
          doctor: {
            select: {
              id: true,
              name: true,
            },
          },
          medicalRecord: {
            include: {
              patient: true,
              appointment: {
                select: nestedAppointmentSelect,
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
        orderBy: { scheduledStart: "asc" },
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
          image: true,
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
    const check = guard(req)
    if (!check.ok) return check.response

    const body = await req.json()

    const data = parseWith(CreateAppointmentSchema, body)

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
        scheduledStart: combineLocalDateTime(data.date, data.slotTime),
        status: AppointmentStatus.Scheduled,

        patientNameSnapshot: patient.name,
        professionalNameSnapshot: doctor.name,
        phoneSnapshot: phone,

        patient: { connect: { id: patient.id } },
        doctor: { connect: { id: doctor.id } },
      },
      include: {
        patient: true,
        doctor: true,
      },
    })

    const session = await getServerSession(authOptions)
    const actorId = session?.user?.id

    if (actorId) {
      await notifyAppointmentAssigned({
        createdById: actorId,
        doctorId: doctor.id,
        appointmentId: appointment.id,
        patientName: patient.name,
        scheduledStart: appointment.scheduledStart,
      })
    } else {
      const doctorUserIds = await resolveUserIdsByDoctorId(doctor.id)
      const fallbackActor = doctorUserIds[0]
      if (fallbackActor) {
        await notifyAppointmentAssigned({
          createdById: fallbackActor,
          doctorId: doctor.id,
          appointmentId: appointment.id,
          patientName: patient.name,
          scheduledStart: appointment.scheduledStart,
        })
      }
    }

    return NextResponse.json(toAppointment(appointment))
  } catch (err) {
    return handleApiError(err)
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await requireSession()
    const body = parseWith(UpdateAppointmentSchema, await req.json())

    const current = await db.appointment.findUnique({
      where: { id: body.id },
      include: { patient: true, doctor: true },
    })

    if (!current) {
      throw new NotFoundError("Agendamento não encontrado")
    }

    const doctorFilter = await resolveAppointmentDoctorFilter(session)
    if (doctorFilter !== undefined && current.doctorId !== doctorFilter) {
      throw new ForbiddenError()
    }

    const currentDate = toLocalDate(current.scheduledStart)
    const currentSlot = toLocalSlotTime(current.scheduledStart)
    const reschedules = Boolean(body.date || body.slotTime || body.data || body.horario)
    const nextDate = body.date ?? body.data ?? currentDate
    const nextSlot = body.slotTime ?? body.horario ?? currentSlot
    const nextDoctor = body.professional ? await resolveDoctor(body.professional) : current.doctor
    const doctorChanged = nextDoctor.id !== current.doctorId
    const scheduleChanged = nextDate !== currentDate || nextSlot !== currentSlot
    const actuallyRescheduled = scheduleChanged || doctorChanged

    if (reschedules || doctorChanged) {
      const conflict = await findAppointmentConflict(
        nextDoctor.id,
        nextDate,
        nextSlot,
        body.id
      )

      if (conflict) {
        throw new ConflictError("Horário já ocupado")
      }
    }

    if (body.status === AppointmentStatus.Paid && current.status === AppointmentStatus.CheckIn) {
      const linked = await db.transaction.findUnique({
        where: { appointmentId: body.id },
      })
      if (!linked) {
        throw new ValidationError(
          "Para marcar como pago, registre antes a receita vinculada a este agendamento (modal «Confirmar pagamento» na agenda)."
        )
      }
    }

    if (body.status === AppointmentStatus.InProgress) {
      const activeForDoctor = await db.appointment.findFirst({
        where: {
          doctorId: current.doctorId,
          status: AppointmentStatus.InProgress,
          id: { not: body.id },
        },
        select: { id: true },
      })
      if (activeForDoctor) {
        throw new ConflictError(
          "Já existe um atendimento em andamento. Finalize-o antes de iniciar outro."
        )
      }
    }

    const updated = await db.appointment.update({
      where: { id: body.id },
      data: {
        ...(reschedules ? { scheduledStart: combineLocalDateTime(nextDate, nextSlot) } : {}),
        ...(doctorChanged
          ? {
              doctor: { connect: { id: nextDoctor.id } },
              professionalNameSnapshot: nextDoctor.name,
            }
          : {}),
        ...(body.status
          ? { status: body.status }
          : actuallyRescheduled
            ? { status: AppointmentStatus.Rescheduled }
            : {}),
        ...(body.startTime !== undefined && {
          startedAt: body.startTime ? new Date(body.startTime as string) : null,
        }),
        ...(body.endTime !== undefined && {
          endedAt: body.endTime ? new Date(body.endTime as string) : null,
        }),
        ...(body.accumulatedTime !== undefined && {
          accumulatedMs: body.accumulatedTime as number,
        }),
        ...(body.pausedAt !== undefined && {
          pausedAt: body.pausedAt ? new Date(body.pausedAt as string) : null,
        }),
      },
      include: {
        patient: true,
        doctor: true,
        transaction: true,
        medicalRecord: {
          include: {
            patient: true,
            appointment: { select: nestedAppointmentSelect },
          },
        },
      },
    })

    return NextResponse.json(toAppointment(updated))
  } catch (err) {
    return handleApiError(err)
  }
}
