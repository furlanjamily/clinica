import { NextResponse } from "next/server"

const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX = 50
const AUTH_SECRET_ENV = "SCHEDULE_API_SECRET"

const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

export type AuthCheckResult = 
  | { ok: true }
  | { ok: false; response: NextResponse }

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? ""
  return forwarded.split(",").map(item => item.trim()).find(Boolean) ?? "unknown"
}

export function getRateLimitState(ip: string) {
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

export function getBearerToken(req: Request): string {
  const authHeader = req.headers.get("authorization") ?? ""
  return authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : ""
}

export function isAuthorized(req: Request): boolean {
  const configuredSecret = process.env[AUTH_SECRET_ENV]?.trim()
  if (!configuredSecret) {
    return true
  }

  return getBearerToken(req) === configuredSecret
}

export function createRateLimitErrorResponse(retryAfterSeconds: number): NextResponse {
  return NextResponse.json(
    { success: false, error: "Too many requests" },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfterSeconds ?? 60),
      },
    }
  )
}

export async function checkRateLimitAndAuth(req: Request): Promise<AuthCheckResult> {
  const ip = getClientIp(req)
  const rateLimit = getRateLimitState(ip)

  if (rateLimit.limited) {
    return {
      ok: false,
      response: createRateLimitErrorResponse(rateLimit.retryAfterSeconds ?? 60),
    }
  }

  if (!isAuthorized(req)) {
    return {
      ok: false,
      response: NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 }),
    }
  }

  return { ok: true }
}
