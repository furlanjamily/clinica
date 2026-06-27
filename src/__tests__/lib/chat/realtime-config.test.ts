import { describe, expect, it, vi, afterEach } from "vitest"
import {
  getSocketServerUrl,
  isRealtimeEnabled,
  REALTIME_POLL_INTERVAL_MS,
} from "@/lib/chat/realtime-config"

describe("realtime-config", () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it("desabilita realtime quando NEXT_PUBLIC_REALTIME_ENABLED=false", () => {
    vi.stubEnv("NEXT_PUBLIC_REALTIME_ENABLED", "false")
    expect(isRealtimeEnabled()).toBe(false)
  })

  it("habilita realtime em dev quando NEXT_PUBLIC_REALTIME_ENABLED=true", () => {
    vi.stubEnv("NEXT_PUBLIC_REALTIME_ENABLED", "true")
    vi.stubEnv("NODE_ENV", "development")
    expect(isRealtimeEnabled()).toBe(true)
  })

  it("exige NEXT_PUBLIC_SOCKET_URL em produção com flag true", () => {
    vi.stubEnv("NEXT_PUBLIC_REALTIME_ENABLED", "true")
    vi.stubEnv("NODE_ENV", "production")
    expect(isRealtimeEnabled()).toBe(false)
    vi.stubEnv("NEXT_PUBLIC_SOCKET_URL", "https://socket.example.com")
    expect(isRealtimeEnabled()).toBe(true)
  })

  it("usa polling interval definido", () => {
    expect(REALTIME_POLL_INTERVAL_MS).toBeGreaterThan(0)
  })

  it("retorna URL do socket sem barra final", () => {
    vi.stubEnv("NEXT_PUBLIC_SOCKET_URL", "https://socket.example.com/")
    expect(getSocketServerUrl()).toBe("https://socket.example.com")
  })
})
