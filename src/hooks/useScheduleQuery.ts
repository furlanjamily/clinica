"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import type { Atendimento } from "@/types/types"
import { absoluteUrl } from "@/lib/absolute-url"

export const SCHEDULE_QUERY_KEY = ["schedule"] as const

async function fetchSchedule(): Promise<Atendimento[]> {
  const res = await fetch(absoluteUrl("/api/schedule"))
  if (!res.ok) throw new Error("Erro ao buscar agendamentos")
  const data = await res.json()
  // a API retorna { agendamentos: [] } ou diretamente []
  return Array.isArray(data) ? data : (data?.agendamentos ?? [])
}

export function useScheduleQuery() {
  return useQuery({
    queryKey: SCHEDULE_QUERY_KEY,
    queryFn: fetchSchedule,
  })
}

export function useInvalidateSchedule() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: SCHEDULE_QUERY_KEY })
}
