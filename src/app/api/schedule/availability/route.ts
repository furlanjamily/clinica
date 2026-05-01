import { NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { gerarHorarios } from "@/lib/schedule/slots"
import { handleApiError } from "@/lib/errors/error-handler"
import { NotFoundError, ValidationError } from "@/lib/errors/custom-errors"

const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX = 20 // max requests per window
const AUTH_SECRET_ENV = "SCHEDULE_AVAILABILITY_SECRET"

// In-memory rate limiting is fine for a single process demo.
// For horizontal scaling, move this to Redis or another shared store.
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

const AvailabilityQuerySchema = z.object({
  medicoNome: z.string().trim().min(1, "medicoNome is required"),
  data: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "data must be in YYYY-MM-DD format")
    .refine(isValidCalendarDate, "data must be a valid calendar date")
    .refine(isTodayOrFuture, "data cannot be in the past"),
})

type AvailabilityQuery = z.infer<typeof AvailabilityQuerySchema>

function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? ""
  return forwarded.split(",").map(item => item.trim()).find(Boolean) ?? "unknown"
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
  const parsed = AvailabilityQuerySchema.safeParse({
    medicoNome: url.searchParams.get("medicoNome") ?? "",
    data: url.searchParams.get("data") ?? "",
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
    const { medicoNome, data } = parseQuery(req)

    const medico = await db.medico.findFirst({
      where: { nome: medicoNome, ativo: true },
      select: { id: true, turno: true },
    })

    if (!medico) {
      throw new NotFoundError("Médico não encontrado ou inativo")
    }

    const possibleSlots = gerarHorarios(medico.turno, data)

    const agendamentos = await db.agendamento.findMany({
      where: {
        medicoId: medico.id,
        data,
        status: { notIn: ["Cancelado", "Concluido"] },
      },
      select: { horario: true },
    })

    const occupiedTimes = new Set<string>(agendamentos.map(({ horario }) => horario))
    const availableTimes = possibleSlots.filter(slot => !occupiedTimes.has(slot))

    return NextResponse.json({ availableTimes })
  } catch (error) {
    return handleApiError(error)
  }
}
