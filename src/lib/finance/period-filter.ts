import { getTodayYYYYMMDD } from "@/lib/time/tz-date"
import { TransactionStatus, type FinanceTransaction } from "./types"

export type RecordPeriod = "hoje" | "semana" | "mes" | "ano"

export const RECORD_PERIOD_OPTIONS: { value: RecordPeriod; label: string }[] = [
  { value: "hoje", label: "Hoje" },
  { value: "semana", label: "Semana" },
  { value: "mes", label: "Mês" },
  { value: "ano", label: "Ano" },
]

function addDaysStr(date: string, days: number): string {
  const [y, m, d] = date.split("-").map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d + days))
  return dt.toISOString().slice(0, 10)
}

function weekDatesFrom(date: string): string[] {
  const [y, m, d] = date.split("-").map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  const dow = dt.getUTCDay()
  const mondayOffset = dow === 0 ? -6 : 1 - dow
  const weekStart = addDaysStr(date, mondayOffset)
  return Array.from({ length: 7 }, (_, i) => addDaysStr(weekStart, i))
}

export function getPeriodDateRange(
  period: RecordPeriod,
  referenceDate = getTodayYYYYMMDD()
): { start: string; end: string } {
  if (period === "hoje") {
    return { start: referenceDate, end: referenceDate }
  }

  if (period === "semana") {
    const dates = weekDatesFrom(referenceDate)
    return { start: dates[0], end: dates[6] }
  }

  if (period === "mes") {
    const prefix = referenceDate.slice(0, 7)
    return { start: `${prefix}-01`, end: `${prefix}-31` }
  }

  const year = referenceDate.slice(0, 4)
  return { start: `${year}-01-01`, end: `${year}-12-31` }
}

function getPreviousPeriodDateRange(
  period: RecordPeriod,
  referenceDate = getTodayYYYYMMDD()
): { start: string; end: string } {
  if (period === "hoje") {
    const prev = addDaysStr(referenceDate, -1)
    return { start: prev, end: prev }
  }

  if (period === "semana") {
    const dates = weekDatesFrom(referenceDate)
    const prevWeekStart = addDaysStr(dates[0], -7)
    const prevWeekEnd = addDaysStr(dates[0], -1)
    return { start: prevWeekStart, end: prevWeekEnd }
  }

  if (period === "mes") {
    const [y, m] = referenceDate.slice(0, 7).split("-").map(Number)
    const prevMonth =
      m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, "0")}`
    const lastDay = new Date(y, m - 1, 0).getDate()
    return {
      start: `${prevMonth}-01`,
      end: `${prevMonth}-${String(lastDay).padStart(2, "0")}`,
    }
  }

  const year = Number(referenceDate.slice(0, 4)) - 1
  return { start: `${year}-01-01`, end: `${year}-12-31` }
}

function isDateInRange(date: string, start: string, end: string): boolean {
  return date >= start && date <= end
}

export function filterTransactionsByPeriod(
  transactions: FinanceTransaction[],
  period: RecordPeriod,
  referenceDate = getTodayYYYYMMDD()
): FinanceTransaction[] {
  const { start, end } = getPeriodDateRange(period, referenceDate)
  return transactions.filter((t) => isDateInRange(t.date, start, end))
}

export function filterTransactionsByPreviousPeriod(
  transactions: FinanceTransaction[],
  period: RecordPeriod,
  referenceDate = getTodayYYYYMMDD()
): FinanceTransaction[] {
  const { start, end } = getPreviousPeriodDateRange(period, referenceDate)
  return transactions.filter((t) => isDateInRange(t.date, start, end))
}

/** Transações confirmadas dentro do período — mesma base usada em Registros e Fluxo de Caixa. */
export function getConfirmedTransactionsForPeriod(
  transactions: FinanceTransaction[],
  period: RecordPeriod,
  referenceDate = getTodayYYYYMMDD()
): FinanceTransaction[] {
  return filterTransactionsByPeriod(transactions, period, referenceDate).filter(
    (t) => t.status === TransactionStatus.Confirmed
  )
}

export function formatPercentChange(current: number, previous: number): string {
  if (previous === 0) {
    return current === 0 ? "0%" : "100%"
  }

  const change = Math.round(((current - previous) / previous) * 100)
  return `${Math.abs(change)}%`
}

export function getPercentDirection(
  current: number,
  previous: number
): "up" | "down" | "neutral" {
  if (current > previous) return "up"
  if (current < previous) return "down"
  return "neutral"
}
