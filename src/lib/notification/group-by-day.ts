import {
  format,
  isToday,
  isYesterday,
  startOfDay,
  subDays,
} from "date-fns"
import { ptBR } from "date-fns/locale"
import type { NotificationDTO, NotificationDayGroupDTO } from "./dto"

function resolveDayLabel(date: Date, now = new Date()): string {
  if (isToday(date)) return "Hoje"
  if (isYesterday(date)) return "Ontem"

  const weekStart = startOfDay(subDays(now, now.getDay() === 0 ? 6 : now.getDay() - 1))
  if (date >= weekStart) {
    const weekday = format(date, "EEEE", { locale: ptBR })
    return weekday.charAt(0).toUpperCase() + weekday.slice(1)
  }

  const formatted = format(date, "d MMM", { locale: ptBR })
  return formatted.charAt(0).toUpperCase() + formatted.slice(1)
}

export function groupNotificationsByDay(
  notifications: NotificationDTO[]
): NotificationDayGroupDTO[] {
  const groups = new Map<string, NotificationDTO[]>()

  for (const notification of notifications) {
    const label = resolveDayLabel(new Date(notification.createdAt))
    const bucket = groups.get(label)
    if (bucket) {
      bucket.push(notification)
    } else {
      groups.set(label, [notification])
    }
  }

  return Array.from(groups.entries()).map(([dayLabel, items]) => ({
    dayLabel,
    notifications: items,
  }))
}
