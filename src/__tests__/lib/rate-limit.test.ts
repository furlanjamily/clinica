// @vitest-environment node
import { createApiGuard, getClientIp } from "@/lib/api/rate-limit"

function makeRequest(ip = "10.0.0.1", headers: Record<string, string> = {}) {
  return new Request("http://localhost/api/test", {
    headers: { "x-forwarded-for": ip, ...headers },
  })
}

describe("createApiGuard — rate limit", () => {
  it("permite requisições até o limite e bloqueia com 429 acima dele", () => {
    const guard = createApiGuard({ max: 3 })

    expect(guard(makeRequest()).ok).toBe(true)
    expect(guard(makeRequest()).ok).toBe(true)
    expect(guard(makeRequest()).ok).toBe(true)

    const blocked = guard(makeRequest())
    expect(blocked.ok).toBe(false)
    if (!blocked.ok) {
      expect(blocked.response.status).toBe(429)
      expect(blocked.response.headers.get("Retry-After")).toBeTruthy()
    }
  })

  it("conta limites por IP de forma independente", () => {
    const guard = createApiGuard({ max: 1 })

    expect(guard(makeRequest("1.1.1.1")).ok).toBe(true)
    expect(guard(makeRequest("2.2.2.2")).ok).toBe(true)
    expect(guard(makeRequest("1.1.1.1")).ok).toBe(false)
  })

  it("reseta a contagem após a janela de tempo", () => {
    vi.useFakeTimers()
    try {
      const guard = createApiGuard({ max: 1, windowMs: 1000 })

      expect(guard(makeRequest()).ok).toBe(true)
      expect(guard(makeRequest()).ok).toBe(false)

      vi.advanceTimersByTime(1500)
      expect(guard(makeRequest()).ok).toBe(true)
    } finally {
      vi.useRealTimers()
    }
  })
})

describe("createApiGuard — autenticação Bearer", () => {
  const ENV_KEY = "TEST_GUARD_SECRET"

  afterEach(() => {
    delete process.env[ENV_KEY]
  })

  it("fica aberto quando o segredo não está configurado", () => {
    const guard = createApiGuard({ max: 10, secretEnv: ENV_KEY })
    expect(guard(makeRequest()).ok).toBe(true)
  })

  it("retorna 401 sem o token e libera com o token correto", () => {
    process.env[ENV_KEY] = "s3gr3do"
    const guard = createApiGuard({ max: 10, secretEnv: ENV_KEY })

    const unauthorized = guard(makeRequest())
    expect(unauthorized.ok).toBe(false)
    if (!unauthorized.ok) expect(unauthorized.response.status).toBe(401)

    const authorized = guard(makeRequest("10.0.0.1", { authorization: "Bearer s3gr3do" }))
    expect(authorized.ok).toBe(true)

    const wrongToken = guard(makeRequest("10.0.0.1", { authorization: "Bearer errado" }))
    expect(wrongToken.ok).toBe(false)
  })
})

describe("getClientIp", () => {
  it("usa o primeiro IP do x-forwarded-for", () => {
    const req = new Request("http://localhost", {
      headers: { "x-forwarded-for": "203.0.113.5, 70.41.3.18" },
    })
    expect(getClientIp(req)).toBe("203.0.113.5")
  })

  it("retorna 'unknown' sem headers de IP", () => {
    expect(getClientIp(new Request("http://localhost"))).toBe("unknown")
  })
})
