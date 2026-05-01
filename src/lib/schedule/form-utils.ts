export function formatDateToInput(date?: string | Date) {
  if (!date) return ""
  return typeof date === "string" ? date : date.toISOString().split("T")[0]
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
