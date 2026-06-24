"use client"

import { useQuery } from "@tanstack/react-query"
import { absoluteUrl } from "@/lib/absolute-url"
import type {
  DashboardOverview,
  DashboardPeriod,
} from "@/components/dashboard/DashboardDataProvider"

export const dashboardOverviewQueryKey = (period: DashboardPeriod, date: string) =>
  ["dashboard", "overview", { period, date }] as const

export function useDashboardOverview(period: DashboardPeriod, referenceDate: string) {
  return useQuery<DashboardOverview>({
    queryKey: dashboardOverviewQueryKey(period, referenceDate),
    queryFn: async () => {
      const params = new URLSearchParams({ period, date: referenceDate })
      const res = await fetch(absoluteUrl(`/api/dashboard/overview?${params}`))
      if (!res.ok) throw new Error("Erro ao carregar dashboard")
      return res.json()
    },
    placeholderData: (prev) => prev,
  })
}
