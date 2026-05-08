const DEFAULT_TZ = "America/Sao_Paulo"

export function getClinicTimeZone() {
  return (process.env.CLINIC_TZ ?? DEFAULT_TZ).trim()
}

export function formatDateYYYYMMDDInTZ(date: Date, timeZone: string) {
  // Usa Intl pra evitar dependências e respeitar TZ.
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date)

  const y = parts.find(p => p.type === "year")?.value
  const m = parts.find(p => p.type === "month")?.value
  const d = parts.find(p => p.type === "day")?.value
  if (!y || !m || !d) throw new Error("Failed to format date")
  return `${y}-${m}-${d}`
}

export function addDays(date: Date, days: number) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

export function getTodayYYYYMMDD() {
  const tz = getClinicTimeZone()
  return formatDateYYYYMMDDInTZ(new Date(), tz)
}

