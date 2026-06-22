import { getTodayYYYYMMDD } from "@/lib/time/tz-date"
import { cn } from "@/lib/utils"

const WEEKDAYS = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
]

const MONTHS = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
]

function addDaysStr(date: string, days: number): string {
  const [y, m, d] = date.split("-").map(Number)
  const dt = new Date(y, m - 1, d)
  dt.setDate(dt.getDate() + days)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`
}

export function formatDayHeader(dateStr: string, today = getTodayYYYYMMDD()): string {
  const [y, m, d] = dateStr.split("-").map(Number)
  const weekday = WEEKDAYS[new Date(y, m - 1, d).getDay()]
  const month = MONTHS[m - 1]

  if (dateStr === today) return `Hoje · ${weekday}, ${d} de ${month}`
  if (dateStr === addDaysStr(today, 1)) return `Amanhã · ${weekday}, ${d} de ${month}`

  return `${weekday}, ${d} de ${month}`
}

export function formatShortDate(dateStr: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr
  const [, m, d] = dateStr.split("-")
  return `${d}/${m}`
}

export type DayGroup<T> = {
  date: string
  label: string
  items: T[]
}

export function groupByDay<T>(items: T[], getDate: (item: T) => string): DayGroup<T>[] {
  const map = new Map<string, T[]>()
  for (const item of items) {
    const key = getDate(item)
    const list = map.get(key) ?? []
    list.push(item)
    map.set(key, list)
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, groupItems]) => ({
      date,
      label: formatDayHeader(date),
      items: groupItems,
    }))
}

export function DaySectionHeader({
  label,
  count,
  variant = "light",
  countNoun,
}: {
  label: string
  count: number
  variant?: "light" | "dark"
  countNoun?: { one: string; other: string }
}) {
  const isDark = variant === "dark"
  const noun = count === 1 ? (countNoun?.one ?? "item") : (countNoun?.other ?? "itens")
  return (
    <div
      className={cn(
        "sticky top-0 z-10 mb-2 mt-4 border-b pb-2 pt-1 first:mt-0",
        isDark ? "border-white/10 bg-primary" : "border-gray-100 bg-white"
      )}
    >
      <p
        className={cn(
          "text-xs font-semibold tracking-wide",
          isDark ? "text-white/90" : "text-gray-600"
        )}
      >
        {label}
      </p>
      <p className={cn("text-[10px]", isDark ? "text-white/40" : "text-gray-400")}>
        {count} {noun}
      </p>
    </div>
  )
}
