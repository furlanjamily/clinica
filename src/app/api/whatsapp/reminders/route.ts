import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { runWhatsAppReminders } from "@/lib/schedule/reminders"

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
  const configuredSecret = process.env.WHATSAPP_REMINDERS_SECRET?.trim()
  if (!configuredSecret) return true

  const authHeader = req.headers.get("authorization") ?? ""
  const bearer = authHeader.startsWith("Bearer ") ? authHeader.slice("Bearer ".length).trim() : ""
  return bearer === configuredSecret
}

export async function POST(req: Request) {
  // Get client IP (simplified; in production, use proper IP extraction)
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown"

  if (isRateLimited(ip)) {
    return NextResponse.json({ success: false, error: "Too many requests" }, { status: 429 })
  }

  if (!isAuthorized(req)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  try {
    const rows = await db.agendamento.findMany({
      where: {
        status: "Agendado",
        whatsappSent: false,
      },
      orderBy: [{ data: "asc" }, { horario: "asc" }],
    })

    await runWhatsAppReminders(rows)

    const sent = rows.filter((row: any) => row.whatsappSent).length

    return NextResponse.json({
      success: true,
      scanned: rows.length,
      sent,
      skipped: rows.length - sent,
    })
  } catch (error) {
    console.error("Error processing WhatsApp reminders:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
