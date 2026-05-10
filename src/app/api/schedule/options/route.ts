import { NextResponse } from "next/server"
import { db } from "@/lib/db"

const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_WINDOW = 60 * 1000
const RATE_LIMIT_MAX = 10

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return false
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return true
  }

  entry.count++
  return false
}

function isAuthorized(req: Request) {
  const configuredSecret = process.env.SCHEDULE_OPTIONS_SECRET?.trim()
  if (!configuredSecret) return true

  const authHeader = req.headers.get("authorization") ?? ""
  const bearer = authHeader.startsWith("Bearer ") ? authHeader.slice("Bearer ".length).trim() : ""
  return bearer === configuredSecret
}

function validatePatientPayload(data: Record<string, unknown>) {
  if (!data || typeof data !== "object") return { valid: false as const, error: "Invalid data" }
  const name = data.name
  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return { valid: false as const, error: "name is required and must be a non-empty string" }
  }
  return { valid: true as const }
}

export async function GET(req: Request) {
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown"

  if (isRateLimited(ip)) {
    return NextResponse.json({ success: false, error: "Too many requests" }, { status: 429 })
  }

  if (!isAuthorized(req)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  try {
    const url = new URL(req.url)
    const limit = parseInt(url.searchParams.get("limit") || "50", 10)
    const offset = parseInt(url.searchParams.get("offset") || "0", 10)

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
    return NextResponse.json({ doctors, patients })
  } catch (error) {
    console.error("Error fetching schedule options:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown"

  if (isRateLimited(ip)) {
    return NextResponse.json({ success: false, error: "Too many requests" }, { status: 429 })
  }

  if (!isAuthorized(req)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const validation = validatePatientPayload(body)
    if (!validation.valid) {
      return NextResponse.json({ success: false, error: validation.error }, { status: 400 })
    }

    const { name: _n, ...rest } = body as Record<string, unknown>
    const created = await db.patient.create({
      data: { name: String(body.name).trim(), ...(rest as object) },
    })
    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    console.error("Error creating patient:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
