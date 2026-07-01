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
  { value: "pending", label: "Pendentes" },
  { value: "in_progress", label: "Em andamento" },
  { value: "completed", label: "Concluídas" },
  { value: "rescheduled", label: "Remarcadas" },
  { value: "cancelled", label: "Canceladas" },
  { value: "all", label: "Todas" },
]

export const APPOINTMENT_PENDING_STATUSES = [
  AppointmentStatus.Scheduled,
  AppointmentStatus.AwaitingConfirmation,
  AppointmentStatus.Confirmed,
] as const

export const APPOINTMENT_IN_PROGRESS_STATUSES = [
  AppointmentStatus.CheckIn,
  AppointmentStatus.AwaitingPayment,
  AppointmentStatus.Paid,
  AppointmentStatus.InProgress,
] as const

export const APPOINTMENT_COMPLETED_STATUSES = [AppointmentStatus.Completed] as const

type StatusGroupRow = { status: string; _count: number }

export function buildDashboardStatusBreakdown(statusGroups: StatusGroupRow[]) {
  const countOf = (list: readonly string[]) =>
    statusGroups
      .filter((group) => list.includes(group.status))
      .reduce((acc, group) => acc + group._count, 0)

  const completed = countOf(APPOINTMENT_COMPLETED_STATUSES)
  const inProgress = countOf(APPOINTMENT_IN_PROGRESS_STATUSES)
  const pending = countOf(APPOINTMENT_PENDING_STATUSES)
  const sum = completed + inProgress + pending || 1

  return {
    completed: Math.round((completed / sum) * 100),
    inProgress: Math.round((inProgress / sum) * 100),
    pending: Math.round((pending / sum) * 100),
    totalProgress: Math.round((completed / sum) * 100),
    counts: { completed, inProgress, pending },
  }
}

export function appointmentStatusBucket(status: string): AgendaStatusFilter {
  if (status === AppointmentStatus.Cancelled) return "cancelled"
  if (status === AppointmentStatus.Rescheduled) return "rescheduled"
  if (APPOINTMENT_COMPLETED_STATUSES.includes(status as (typeof APPOINTMENT_COMPLETED_STATUSES)[number])) {
    return "completed"
  }
  if (APPOINTMENT_IN_PROGRESS_STATUSES.includes(status as (typeof APPOINTMENT_IN_PROGRESS_STATUSES)[number])) {
    return "in_progress"
  }
  if (APPOINTMENT_PENDING_STATUSES.includes(status as (typeof APPOINTMENT_PENDING_STATUSES)[number])) {
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
