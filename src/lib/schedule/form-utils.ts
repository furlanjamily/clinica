export function formatDateToInput(date?: string | Date) {
  if (!date) return ""
  return typeof date === "string" ? date : date.toISOString().split("T")[0]
}

export function getInitialScheduleForm(item?: {
  patient?: { id?: number; name?: string }
  patientId?: number
  doctorId?: number
  date?: string
  slotTime?: string
}) {
  const patientId = item?.patient?.id ?? item?.patientId
  return {
    patientId: patientId ? String(patientId) : "",
    doctorId: item?.doctorId ? String(item.doctorId) : "",
    date: formatDateToInput(item?.date),
    slotTime: item?.slotTime ?? "",
  }
}

export function ensureOption(
  options: { value: string; label: string }[],
  value: string,
  label: string
) {
  if (!value || options.some((option) => option.value === value)) return options
  return [...options, { value, label }]
}

type NamedEntity = { id: number; name: string }

export function resolveScheduleSelection(
  id: string,
  list: NamedEntity[],
  fallback?: { id?: number; name?: string | null }
): NamedEntity | null {
  const fromList = list.find((entry) => String(entry.id) === id)
  if (fromList) return fromList

  const parsedId = Number(id)
  if (!parsedId || Number.isNaN(parsedId)) return null

  if (fallback?.id === parsedId) {
    const fallbackName = fallback.name?.trim()
    if (fallbackName) return { id: parsedId, name: fallbackName }
  }

  return null
}

export function isDateDisabled(dateString: string) {
  const date = new Date(`${dateString}T00:00:00`)
  return date.getUTCDay() === 0
}

export function filterAvailableSlots(
  slots: string[],
  selectedDate: string,
  today: string,
  now: string
) {
  return slots.filter((slot) => {
    if (selectedDate === today && slot <= now) return false
    return true
  })
}
