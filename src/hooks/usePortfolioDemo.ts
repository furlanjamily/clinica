"use client"

import { absoluteUrl } from "@/lib/absolute-url"

export type PortfolioCredentials = {
  email: string
  password: string
}

type FetchResult =
  | { ok: true; credentials: PortfolioCredentials }
  | { ok: false; status: number }

export async function fetchPortfolioCredentials(): Promise<FetchResult> {
  const res = await fetch(absoluteUrl("/api/auth/portfolio-credentials"), { cache: "no-store" })
  if (!res.ok) return { ok: false, status: res.status }

  try {
    const body = (await res.json()) as { email?: string; password?: string }
    if (!body.email || body.password == null) return { ok: false, status: res.status }
    return { ok: true, credentials: { email: body.email, password: body.password } }
  } catch {
    return { ok: false, status: res.status }
  }
}
