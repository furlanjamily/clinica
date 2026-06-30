import type { DashboardPeriod } from "@/components/dashboard/DashboardDataProvider"

function addDaysStr(date: string, days: number): string {
  const [y, m, d] = date.split("-").map(Number)
  const dt = new Date(y, m - 1, d)
  dt.setDate(dt.getDate() + days)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`
}

function weekDatesFrom(date: string): string[] {
  const [y, m, d] = date.split("-").map(Number)
  const dt = new Date(y, m - 1, d)
  const dow = dt.getDay()
  const mondayOffset = dow === 0 ? -6 : 1 - dow
  const weekStart = addDaysStr(date, mondayOffset)
  return Array.from({ length: 7 }, (_, i) => addDaysStr(weekStart, i))
}

export function getDashboardPeriodDateRange(
  period: DashboardPeriod,
  referenceDate: string
): { start: string; end: string } {
  if (period === "day") {
    return { start: referenceDate, end: referenceDate }
  }

  if (period === "week") {
    const dates = weekDatesFrom(referenceDate)
    return { start: dates[0], end: dates[6] }
  }

  const prefix = referenceDate.slice(0, 7)
  return { start: `${prefix}-01`, end: `${prefix}-31` }
}

export function isDateInDashboardPeriod(
  date: string,
  period: DashboardPeriod,
  referenceDate: string
): boolean {
  const { start, end } = getDashboardPeriodDateRange(period, referenceDate)
  return date >= start && date <= end
}
