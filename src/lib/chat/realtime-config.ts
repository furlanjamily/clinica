/** Intervalo de polling quando Socket.IO não está disponível (ex.: Vercel serverless). */
export const REALTIME_POLL_INTERVAL_MS = 5_000

export function isRealtimeEnabled(): boolean {
  const flag = process.env.NEXT_PUBLIC_REALTIME_ENABLED
  if (flag === "true") return true
  if (flag === "false") return false
  return true
}

/** URL do servidor Socket.IO; omitir para usar a mesma origem (dev com server.ts). */
export function getSocketServerUrl(): string | undefined {
  const url = process.env.NEXT_PUBLIC_SOCKET_URL?.replace(/\/$/, "")
  return url || undefined
}
