"use client"

import { useMemo, useState } from "react"
import {
  isSameDay,
  isSameMonth,
  isWithinInterval,
  startOfWeek,
  endOfWeek,
} from "date-fns"
import type { Atendimento } from "@/types/types"
import { useTableFilters } from "@/hooks/useTableFilters"

type Filters = {
  status?: string
  paciente?: string
  profissional?: string
  atendimentoId?: number
}

export type ViewMode = "dia" | "semana" | "mes" | "lista" 

export function filterSchedules(data: Atendimento[], date: Date, view: ViewMode, filters: Filters): Atendimento[] {
  return data.filter((item) => {
    const [y, m, d] = item.data.split("-").map(Number)
    const itemDate = new Date(y, m - 1, d)

    const matchStatus = filters.status ? item.status === filters.status : true

    const matchPaciente = filters.paciente
      ? item.paciente.nome.toLowerCase().includes(filters.paciente.toLowerCase())
      : true

    const matchProfissional = filters.profissional
      ? item.profissionalNome.toLowerCase().includes(filters.profissional.toLowerCase())
      : true

    const matchAtendimento = filters.atendimentoId !== undefined
      ? item.id === filters.atendimentoId
      : true

    let matchDate = true

    if (view === "dia") {
      matchDate = isSameDay(itemDate, date)
    } else if (view === "semana") {
      matchDate = isWithinInterval(itemDate, { start: startOfWeek(date), end: endOfWeek(date) })
    } else if (view === "mes") {
      matchDate = isSameMonth(itemDate, date)
    }

    return matchStatus && matchPaciente && matchProfissional && matchAtendimento && matchDate
  })
}

export function useSchedule(data: Atendimento[]) {
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

