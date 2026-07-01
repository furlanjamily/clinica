import type { DashboardAgendaItem, DashboardPeriod } from "@/components/dashboard/DashboardDataProvider"
import type { UserTaskDTO } from "@/lib/user-task/mapper"
import { isDateInDashboardPeriod } from "@/lib/dashboard/period-range"
import { AppointmentStatus } from "@/lib/schedule/status"

export function isDashboardAgendaDataFresh(
  data: { period: DashboardPeriod; referenceDate: string } | null | undefined,
  period: DashboardPeriod,
  referenceDate: string
): boolean {
  if (!data) return false
  return data.period === period && data.referenceDate === referenceDate
}

export function normalizeTimeHHmm(time: string): string {
  const [hour = "00", minute = "00"] = time.split(":")
  return `${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`
}

export function getClinicNowTimeHHmm(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now)

  const hour = parts.find((part) => part.type === "hour")?.value ?? "00"
  const minute = parts.find((part) => part.type === "minute")?.value ?? "00"
  return normalizeTimeHHmm(`${hour}:${minute}`)
}

export function shouldIncludeDashboardAgendaAppointment(
  item: Pick<DashboardAgendaItem, "date" | "time" | "status">,
  period: DashboardPeriod,
  referenceDate: string,
  today: string,
  nowTime = getClinicNowTimeHHmm()
): boolean {
  if (period === "day" && item.date !== referenceDate) return false

  if (
    period === "day" &&
    referenceDate === today &&
    item.date === today &&
    normalizeTimeHHmm(item.time) < normalizeTimeHHmm(nowTime)
  ) {
    if (
      item.status === AppointmentStatus.Scheduled ||
      item.status === AppointmentStatus.AwaitingConfirmation
    ) {
      return false
    }
  }

  return true
}

export function filterDashboardAgendaAppointments(
  appointments: DashboardAgendaItem[],
  period: DashboardPeriod,
  referenceDate: string,
  today: string
): DashboardAgendaItem[] {
  const nowTime = getClinicNowTimeHHmm()
  return appointments.filter((item) => {
    if (!isDateInDashboardPeriod(item.date, period, referenceDate)) return false
    return shouldIncludeDashboardAgendaAppointment(item, period, referenceDate, today, nowTime)
  })
}

export function filterDashboardAgendaTasks(
  tasks: UserTaskDTO[],
  period: DashboardPeriod,
  referenceDate: string
): UserTaskDTO[] {
  return tasks.filter((task) => isDateInDashboardPeriod(task.date, period, referenceDate))
}
