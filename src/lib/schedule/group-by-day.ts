import type { Appointment } from "./types"
import type { RowType } from "@/types/rowType"

/** Converte "YYYY-MM-DD" (ou Date) em Date local sem deslocamento de fuso. */
export function normalizeDate(date: string | number | Date): Date {
  if (date instanceof Date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate())
  }
  const [year, month, day] = String(date).split("-").map(Number)
  return new Date(year, month - 1, day)
}

export function sortByTime(a: Appointment, b: Appointment): number {
  return a.slotTime.localeCompare(b.slotTime)
}

/**
 * Agrupa agendamentos por mês/dia e devolve uma lista achatada de linhas
 * (cabeçalhos de dia + dados ordenados por horário) pronta para tabelas.
 */
export function flattenAppointmentsByDay(items: Appointment[]): RowType[] {
  const grouped = items.reduce<Record<string, Record<string, Appointment[]>>>(
    (acc, item) => {
      const date = normalizeDate(item.date)
      const month = date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
      const day = date.toLocaleDateString("pt-BR", { day: "2-digit", month: "long" })

      acc[month] ??= {}
      acc[month][day] ??= []
      acc[month][day].push(item)
      return acc
    },
    {}
  )

  const byFirstAppointmentDate = (
    a: [string, Appointment[]] | [string, Record<string, Appointment[]>],
    b: [string, Appointment[]] | [string, Record<string, Appointment[]>]
  ) => {
    const firstDate = (value: Appointment[] | Record<string, Appointment[]>) =>
      Array.isArray(value) ? value[0].date : value[Object.keys(value)[0]][0].date
    return new Date(firstDate(a[1])).getTime() - new Date(firstDate(b[1])).getTime()
  }

  const rows: RowType[] = []

  Object.entries(grouped)
    .sort(byFirstAppointmentDate)
    .forEach(([, days]) => {
      Object.entries(days)
        .sort(byFirstAppointmentDate)
        .forEach(([day, items]) => {
          rows.push({ type: "day", label: day })
          ;[...items].sort(sortByTime).forEach((item) => {
            rows.push({ ...item, type: "data" })
          })
        })
    })

  return rows
}
