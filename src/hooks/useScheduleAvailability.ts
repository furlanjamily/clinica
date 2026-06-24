"use client"

import { useQuery } from "@tanstack/react-query"
import { absoluteUrl } from "@/lib/absolute-url"

type AvailabilityResponse = {
  availableTimes?: string[]
}

export function useScheduleAvailability(doctorName: string | undefined, date: string) {
  return useQuery<string[]>({
    queryKey: ["schedule", "availability", doctorName, date] as const,
    queryFn: async () => {
      const params = new URLSearchParams({
        doctorName: doctorName!,
        date,
      })
      const res = await fetch(absoluteUrl(`/api/schedule/availability?${params}`))
      if (!res.ok) throw new Error("Erro ao buscar horários disponíveis")
      const data: AvailabilityResponse = await res.json()
      return Array.isArray(data.availableTimes) ? data.availableTimes : []
    },
    enabled: Boolean(doctorName && date),
    staleTime: 30_000,
  })
}
