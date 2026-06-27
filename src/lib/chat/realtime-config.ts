/** Intervalo de polling quando Socket.IO não está disponível (ex.: Vercel serverless). */
export const REALTIME_POLL_INTERVAL_MS = 5_000

export function isRealtimeEnabled(): boolean {
  const flag = process.env.NEXT_PUBLIC_REALTIME_ENABLED
  if (flag === "false") return false
  if (flag === "true") {
    return Boolean(getSocketServerUrl()) || process.env.NODE_ENV === "development"
  }
  // Local com server.ts; em produção (Vercel) exige flag + NEXT_PUBLIC_SOCKET_URL.
  return process.env.NODE_ENV === "development"
}

/** URL do servidor Socket.IO; omitir para usar a mesma origem (dev com server.ts). */
export function getSocketServerUrl(): string | undefined {
  const url = process.env.NEXT_PUBLIC_SOCKET_URL?.replace(/\/$/, "")
  return url || undefined
}
