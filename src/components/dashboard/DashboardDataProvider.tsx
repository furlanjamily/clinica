"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react"
import { getTodayYYYYMMDD } from "@/lib/time/tz-date"

export type DashboardPeriod = "day" | "week" | "month"

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
  isSelected?: boolean
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

export type DashboardFocusPatient = {
  patientName: string
  demographics: string
  patientId: string
  appointmentDate: string
  appointmentTime: string
  statusLabel: string
  contextLabel: string
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
  referenceDate: string
  periodLabel: string
  kpis: DashboardKpis
  calendarLabel: string
  calendarMode: "week" | "month"
  calendar: DashboardCalendarDay[]
  periodAgenda: DashboardAgendaItem[]
  featuredDoctor: DashboardFeaturedDoctor | null
  focusPatient: DashboardFocusPatient | null
  lastVisit: DashboardLastVisit | null
  statusBreakdown: DashboardStatusBreakdown
}

type DashboardContextValue = {
  data: DashboardOverview | null
  loading: boolean
  period: DashboardPeriod
  setPeriod: (period: DashboardPeriod) => void
  navigatePrevious: () => void
  navigateNext: () => void
  selectDay: (date: string) => void
}

function addDaysStr(date: string, days: number): string {
  const [y, m, d] = date.split("-").map(Number)
  const dt = new Date(y, m - 1, d)
  dt.setDate(dt.getDate() + days)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`
}

function addMonthsStr(date: string, months: number): string {
  const [y, m, d] = date.split("-").map(Number)
  const dt = new Date(y, m - 1 + months, d)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`
}

function shiftReferenceDate(period: DashboardPeriod, date: string, direction: -1 | 1): string {
  if (period === "day") return addDaysStr(date, direction)
  if (period === "week") return addDaysStr(date, direction * 7)
  return addMonthsStr(date, direction)
}

const DashboardContext = createContext<DashboardContextValue>({
  data: null,
  loading: true,
  period: "day",
  setPeriod: () => {},
  navigatePrevious: () => {},
  navigateNext: () => {},
  selectDay: () => {},
})

export function DashboardDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<DashboardOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriodState] = useState<DashboardPeriod>("day")
  const [referenceDate, setReferenceDate] = useState(getTodayYYYYMMDD)

  const setPeriod = useCallback((next: DashboardPeriod) => {
    setReferenceDate(getTodayYYYYMMDD())
    setPeriodState(next)
  }, [])

  const navigatePrevious = useCallback(() => {
    setReferenceDate((current) => shiftReferenceDate(period, current, -1))
  }, [period])

  const navigateNext = useCallback(() => {
    setReferenceDate((current) => shiftReferenceDate(period, current, 1))
  }, [period])

  const selectDay = useCallback((date: string) => {
    setReferenceDate(date)
  }, [])

  useEffect(() => {
    let active = true
    setLoading(true)
    fetch(`/api/dashboard/overview?period=${period}&date=${referenceDate}`)
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
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [period, referenceDate])

  return (
    <DashboardContext.Provider
      value={{
        data,
        loading,
        period,
        setPeriod,
        navigatePrevious,
        navigateNext,
        selectDay,
      }}
    >
      {children}
    </DashboardContext.Provider>
  )
}

export function useDashboard() {
  return useContext(DashboardContext)
}
