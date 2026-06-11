import { NextResponse } from "next/server"

export type GuardResult = { ok: true } | { ok: false; response: NextResponse }

type ApiGuardOptions = {
  /** Máximo de requisições por janela (por IP). */
  max: number
  /** Janela de tempo em ms. Padrão: 1 minuto. */
  windowMs?: number
  /** Variável de ambiente com o segredo Bearer. Se vazia/ausente, a rota fica aberta. */
  secretEnv?: string
}

export function getClientIp(req: Request): string {
  const forwarded =
    req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? ""
  return forwarded.split(",").map((item) => item.trim()).find(Boolean) ?? "unknown"
}

function getBearerToken(req: Request): string {
  const authHeader = req.headers.get("authorization") ?? ""
  return authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : ""
}

/**
 * Cria um guard de rota com rate limit em memória (por IP) e autenticação
 * opcional via Bearer token. Centraliza o padrão antes duplicado em cada rota.
 *
 * Uso:
 * ```ts
 * const guard = createApiGuard({ max: 50, secretEnv: "SCHEDULE_API_SECRET" })
 * const check = guard(req)
 * if (!check.ok) return check.response
 * ```
 */
export function createApiGuard({ max, windowMs = 60_000, secretEnv }: ApiGuardOptions) {
  const hits = new Map<string, { count: number; resetTime: number }>()

  function isRateLimited(ip: string): { limited: boolean; retryAfterSeconds?: number } {
    const now = Date.now()
    const entry = hits.get(ip)

    if (!entry || now > entry.resetTime) {
      hits.set(ip, { count: 1, resetTime: now + windowMs })
      return { limited: false }
    }

    if (entry.count >= max) {
      return { limited: true, retryAfterSeconds: Math.ceil((entry.resetTime - now) / 1000) }
    }

    entry.count += 1
    return { limited: false }
  }

  function isAuthorized(req: Request): boolean {
    const secret = secretEnv ? process.env[secretEnv]?.trim() : undefined
    if (!secret) return true
    return getBearerToken(req) === secret
  }

  return function guard(req: Request): GuardResult {
    const rateLimit = isRateLimited(getClientIp(req))

    if (rateLimit.limited) {
      return {
        ok: false,
        response: NextResponse.json(
          { message: "Too many requests" },
          {
            status: 429,
            headers: { "Retry-After": String(rateLimit.retryAfterSeconds ?? 60) },
          }
        ),
      }
    }

    if (!isAuthorized(req)) {
      return {
        ok: false,
        response: NextResponse.json({ message: "Unauthorized" }, { status: 401 }),
      }
    }

    return { ok: true }
  }
}
