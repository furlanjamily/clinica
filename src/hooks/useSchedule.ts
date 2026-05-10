"use client"

import { useMemo, useState } from "react"
import {
  isSameDay,
  isSameMonth,
  isWithinInterval,
  startOfWeek,
  endOfWeek,
} from "date-fns"
import type { Appointment } from "@/types/types"
import { useTableFilters } from "@/hooks/useTableFilters"

type Filters = {
  status?: string
  patient?: string
  professional?: string
  appointmentId?: number
}

export type ViewMode = "dia" | "semana" | "mes" | "lista"

export function filterSchedules(data: Appointment[], date: Date, view: ViewMode, filters: Filters): Appointment[] {
  return data.filter((item) => {
    const [y, m, d] = item.date.split("-").map(Number)
    const itemDate = new Date(y, m - 1, d)

    const matchStatus = filters.status ? item.status === filters.status : true

    const patientName = (item.patient?.name ?? item.patientName ?? "").toLowerCase()

    const matchPatient = filters.patient
      ? patientName.includes(filters.patient.toLowerCase())
      : true

    const matchProfessional = filters.professional
      ? (item.professionalName ?? "").toLowerCase().includes(filters.professional.toLowerCase())
      : true

    const matchAppointment = filters.appointmentId !== undefined
      ? item.id === filters.appointmentId
      : true

    let matchDate = true

    if (view === "dia") {
      matchDate = isSameDay(itemDate, date)
    } else if (view === "semana") {
      matchDate = isWithinInterval(itemDate, { start: startOfWeek(date), end: endOfWeek(date) })
    } else if (view === "mes") {
      matchDate = isSameMonth(itemDate, date)
    }

    return matchStatus && matchPatient && matchProfessional && matchAppointment && matchDate
  })
}

export function useSchedule(data: Appointment[]) {
  const [date, setDate] = useState(new Date())
  const [view, setView] = useState<ViewMode>("dia")
  const { filters, setFilters, handleFilterChange } = useTableFilters<Filters>({})

  const filteredData = useMemo(() => {
    return filterSchedules(data, date, view, filters)
  }, [data, date, view, filters])

  return {
    date,
    setDate,
    view,
    setView,
    filters,
    setFilters,
    handleFilterChange,
    filteredData,
  }
}
