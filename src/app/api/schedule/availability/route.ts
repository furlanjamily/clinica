import { NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { gerarHorarios } from "@/lib/schedule/slots"
import { handleApiError } from "@/lib/errors/error-handler"
import { NotFoundError, ValidationError } from "@/lib/errors/custom-errors"
import { createApiGuard } from "@/lib/api/rate-limit"
import { AppointmentStatus } from "@/lib/schedule/status"
import {
  startOfLocalDay,
  startOfNextLocalDay,
  toLocalSlotTime,
} from "@/lib/datetime/appointment-time"

const guard = createApiGuard({ max: 20, secretEnv: "SCHEDULE_AVAILABILITY_SECRET" })

const AvailabilityQuerySchema = z.object({
  doctorName: z.string().trim().min(1, "doctorName is required"),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "date must be in YYYY-MM-DD format")
    .refine(isValidCalendarDate, "date must be a valid calendar date")
    .refine(isTodayOrFuture, "date cannot be in the past"),
})

type AvailabilityQuery = z.infer<typeof AvailabilityQuerySchema>

function parseQuery(req: Request): AvailabilityQuery {
  const url = new URL(req.url)
  const doctorName = url.searchParams.get("doctorName") ?? url.searchParams.get("medicoNome") ?? ""
  const date = url.searchParams.get("date") ?? url.searchParams.get("data") ?? ""
  const parsed = AvailabilityQuerySchema.safeParse({
    doctorName,
    date,
  })

  if (!parsed.success) {
    throw new ValidationError("Invalid query parameters", parsed.error.format())
  }

  return parsed.data
}

function parseIsoDate(value: string): Date | null {
  const [year, month, day] = value.split("-").map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() + 1 !== month ||
    date.getUTCDate() !== day
  ) {
    return null
  }

  return date
}

function isValidCalendarDate(value: string): boolean {
  return parseIsoDate(value) !== null
}

function isTodayOrFuture(value: string): boolean {
  const requestedDate = parseIsoDate(value)
  if (!requestedDate) return false

  const now = new Date()
  const todayUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  return requestedDate >= todayUtc
}

export async function GET(req: Request) {
  const check = guard(req)
  if (!check.ok) return check.response

  try {
    const { doctorName, date } = parseQuery(req)

    const doctor = await db.doctor.findFirst({
      where: { name: doctorName, active: true },
      select: { id: true, shift: true },
    })

    if (!doctor) {
      throw new NotFoundError("Médico não encontrado ou inativo")
    }

    const possibleSlots = gerarHorarios(doctor.shift, date)

    const appointments = await db.appointment.findMany({
      where: {
        doctorId: doctor.id,
        scheduledStart: {
          gte: startOfLocalDay(date),
          lt: startOfNextLocalDay(date),
        },
        status: { notIn: [AppointmentStatus.Cancelled, AppointmentStatus.Completed] },
      },
      select: { scheduledStart: true },
    })

    const occupiedTimes = new Set<string>(
      appointments.map(({ scheduledStart }) => toLocalSlotTime(scheduledStart))
    )
    const availableTimes = possibleSlots.filter((slot) => !occupiedTimes.has(slot))

    return NextResponse.json({ availableTimes })
  } catch (error) {
    return handleApiError(error)
  }
}
