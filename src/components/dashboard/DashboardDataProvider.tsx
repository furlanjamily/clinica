"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"

export type DashboardPeriod = "today" | "week" | "month"

export type DashboardKpis = {
  patientsInRange: number
  newPatientsRange: number
  completedRange: number
  completedGrowthPct: number | null
  scheduledInRange: number
  cancelledRange: number
  recordsRange: number
  revenueRange: number
  revenueGrowthPct: number | null
  attendanceRate: number
}

export type DashboardCalendarDay = {
  date: string | null
  weekday: string | null
  day: number | null
  count: number
  isToday: boolean
  inPeriod?: boolean
}

export type DashboardAgendaItem = {
  id: number
  date: string
  time: string
  endTime: string | null
  patientName: string
  professionalName: string
  status: string
  statusLabel: string
}

export type DashboardFeaturedDoctor = {
  name: string
  specialty: string
  qualification: string | null
  shift: string | null
  completedCount: number
}

export type DashboardLastVisit = {
  patientName: string
  demographics: string
  patientId: string
  lastChecked: { doctor: string; date: string }
  diagnosis: string | null
  observation: string | null
  conduct: string | null
  prescriptions: { drug: string; instruction: string }[]
}

export type DashboardStatusBreakdown = {
  completed: number
  inProgress: number
  pending: number
  totalProgress: number
  counts: { completed: number; inProgress: number; pending: number }
}

export type DashboardOverview = {
  period: DashboardPeriod
  periodLabel: string
  kpis: DashboardKpis
  calendarLabel: string
  calendarMode: "week" | "month"
  calendar: DashboardCalendarDay[]
  periodAgenda: DashboardAgendaItem[]
  featuredDoctor: DashboardFeaturedDoctor | null
  lastVisit: DashboardLastVisit | null
  statusBreakdown: DashboardStatusBreakdown
}

type DashboardContextValue = {
  data: DashboardOverview | null
  loading: boolean
  error: boolean
  period: DashboardPeriod
  setPeriod: (period: DashboardPeriod) => void
}

const DashboardContext = createContext<DashboardContextValue>({
  data: null,
  loading: true,
  error: false,
  period: "month",
  setPeriod: () => {},
})

export function DashboardDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<DashboardOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [period, setPeriod] = useState<DashboardPeriod>("today")

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(false)
    fetch(`/api/dashboard/overview?period=${period}`)
      .then((res) => {
        if (!res.ok) throw new Error("overview failed")
        return res.json()
      })
      .then((json: DashboardOverview) => {
        if (active) {
          setData(json)
          setLoading(false)
        }
      })
      .catch(() => {
        if (active) {
          setError(true)
          setLoading(false)
        }
      })
    return () => {
      active = false
    }
  }, [period])

  return (
    <DashboardContext.Provider value={{ data, loading, error, period, setPeriod }}>
      {children}
    </DashboardContext.Provider>
  )
}

export function useDashboard() {
  return useContext(DashboardContext)
}
