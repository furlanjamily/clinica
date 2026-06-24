"use client"

import type { Appointment } from "@/types/types"
import { absoluteUrl } from "@/lib/absolute-url"

export const SCHEDULE_QUERY_KEY = ["schedule"] as const

export async function fetchSchedule(): Promise<Appointment[]> {
  const res = await fetch(absoluteUrl("/api/schedule"))
  if (!res.ok) throw new Error("Erro ao buscar agendamentos")
  const data = await res.json()
  return Array.isArray(data) ? data : (data?.appointments ?? [])
}
