import { AppointmentStatus } from "@/lib/schedule/status"
import type { DashboardAgendaItem } from "@/components/dashboard/DashboardDataProvider"
import type { UserTaskDTO } from "@/lib/user-task/mapper"

export type AgendaStatusFilter =
  | "all"
  | "pending"
  | "rescheduled"
  | "in_progress"
  | "completed"
  | "cancelled"

export const AGENDA_STATUS_FILTERS: { value: AgendaStatusFilter; label: string }[] = [
  { value: "all", label: "Todas" },
  { value: "pending", label: "Pendentes" },
  { value: "rescheduled", label: "Remarcadas" },
  { value: "in_progress", label: "Em andamento" },
  { value: "completed", label: "Concluídas" },
  { value: "cancelled", label: "Canceladas" },
]

const APPOINTMENT_PENDING = [
  AppointmentStatus.Scheduled,
  AppointmentStatus.AwaitingConfirmation,
  AppointmentStatus.Confirmed,
]

const APPOINTMENT_IN_PROGRESS = [
  AppointmentStatus.CheckIn,
  AppointmentStatus.AwaitingPayment,
  AppointmentStatus.InProgress,
]

const APPOINTMENT_COMPLETED = [AppointmentStatus.Completed, AppointmentStatus.Paid]

export function appointmentStatusBucket(status: string): AgendaStatusFilter {
  if (status === AppointmentStatus.Cancelled) return "cancelled"
  if (status === AppointmentStatus.Rescheduled) return "rescheduled"
  if (APPOINTMENT_COMPLETED.includes(status as (typeof APPOINTMENT_COMPLETED)[number])) {
    return "completed"
  }
  if (APPOINTMENT_IN_PROGRESS.includes(status as (typeof APPOINTMENT_IN_PROGRESS)[number])) {
    return "in_progress"
  }
  if (APPOINTMENT_PENDING.includes(status as (typeof APPOINTMENT_PENDING)[number])) {
    return "pending"
  }
  return "pending"
}

export function taskStatusBucket(status: UserTaskDTO["status"]): AgendaStatusFilter {
  return status
}

export function matchesAgendaStatusFilter(
  filter: AgendaStatusFilter,
  entry:
    | { kind: "appointment"; item: DashboardAgendaItem }
    | { kind: "task"; item: UserTaskDTO }
): boolean {
  if (filter === "all") return true

  const bucket =
    entry.kind === "appointment"
      ? appointmentStatusBucket(entry.item.status)
      : taskStatusBucket(entry.item.status)

  return bucket === filter
}
