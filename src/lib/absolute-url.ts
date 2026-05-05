/**
 * `fetch("/api/...")` falha no Node (RSC / pré-render de Client Components com Suspense)
 * porque não há origem. No browser, URL relativa continua ok.
 */
export function absoluteUrl(path: string): string {
  const pathname = path.startsWith("/") ? path : `/${path}`
  if (typeof window !== "undefined") return pathname

  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "")
  if (fromEnv) return `${fromEnv}${pathname}`

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/\/$/, "")}${pathname}`
  }

  const port = process.env.PORT ?? "3000"
  return `http://127.0.0.1:${port}${pathname}`
}
