import { NextResponse } from "next/server"
import { db } from "@/lib/db"

// Simple in-memory rate limiter (for demo; use Redis or similar in production)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX = 10 // Max requests per window

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

function validatePacienteData(data: any) {
  if (!data || typeof data !== "object") return { valid: false, error: "Invalid data" }
  if (!data.nome || typeof data.nome !== "string" || data.nome.trim().length === 0) {
    return { valid: false, error: "Nome is required and must be a non-empty string" }
  }
  // Add more validations as needed (e.g., email, phone)
  return { valid: true }
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

    const [medicosDb, pacientes] = await Promise.all([
      db.medico.findMany({
        where: { ativo: true },
        orderBy: { nome: "asc" },
        take: limit,
        skip: offset,
      }),
      db.paciente.findMany({
        orderBy: { nome: "asc" },
        take: limit,
        skip: offset,
      }),
    ])

    const medicos = medicosDb.map((m: any) => ({ id: m.id, nome: m.nome, turno: m.turno }))
    return NextResponse.json({ medicos, pacientes })
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
    const validation = validatePacienteData(body)
    if (!validation.valid) {
      return NextResponse.json({ success: false, error: validation.error }, { status: 400 })
    }

    const novo = await db.paciente.create({ data: { nome: body.nome.trim(), ...body } })
    return NextResponse.json(novo, { status: 201 })
  } catch (error) {
    console.error("Error creating paciente:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
