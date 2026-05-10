import { NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { gerarHorarios } from "@/lib/schedule/slots"
import { handleApiError } from "@/lib/errors/error-handler"
import { NotFoundError, ValidationError } from "@/lib/errors/custom-errors"

const RATE_LIMIT_WINDOW = 60 * 1000
const RATE_LIMIT_MAX = 20
const AUTH_SECRET_ENV = "SCHEDULE_AVAILABILITY_SECRET"

const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

const AvailabilityQuerySchema = z.object({
  doctorName: z.string().trim().min(1, "doctorName is required"),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "date must be in YYYY-MM-DD format")
    .refine(isValidCalendarDate, "date must be a valid calendar date")
    .refine(isTodayOrFuture, "date cannot be in the past"),
})

type AvailabilityQuery = z.infer<typeof AvailabilityQuerySchema>

function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? ""
  return forwarded.split(",").map((item) => item.trim()).find(Boolean) ?? "unknown"
}

function getRateLimitState(ip: string) {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return { limited: false, remaining: RATE_LIMIT_MAX - 1 }
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return {
      limited: true,
      retryAfterSeconds: Math.ceil((entry.resetTime - now) / 1000),
    }
  }

  entry.count += 1
  return { limited: false, remaining: RATE_LIMIT_MAX - entry.count }
}

function getBearerToken(req: Request): string {
  const authHeader = req.headers.get("authorization") ?? ""
  return authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : ""
}

function isAuthorized(req: Request): boolean {
  const configuredSecret = process.env[AUTH_SECRET_ENV]?.trim()
  if (!configuredSecret) {
    return true
  }

  return getBearerToken(req) === configuredSecret
}

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
  const ip = getClientIp(req)
  const rateLimit = getRateLimitState(ip)

  if (rateLimit.limited) {
    return NextResponse.json(
      { success: false, error: "Too many requests" },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimit.retryAfterSeconds ?? 60),
        },
      }
    )
  }

  if (!isAuthorized(req)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

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
        date,
        status: { notIn: ["Cancelado", "Concluido"] },
      },
      select: { slotTime: true },
    })

    const occupiedTimes = new Set<string>(appointments.map(({ slotTime }) => slotTime))
    const availableTimes = possibleSlots.filter((slot) => !occupiedTimes.has(slot))

    return NextResponse.json({ availableTimes })
  } catch (error) {
    return handleApiError(error)
  }
}
