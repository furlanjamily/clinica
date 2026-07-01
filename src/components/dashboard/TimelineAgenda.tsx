"use client"

import { useMemo, useState } from "react"
import { motion } from "framer-motion"
import { Filter } from "lucide-react"
import { HiOutlineClipboardList, HiOutlineUser } from "react-icons/hi"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { STATUS_STYLE } from "@/lib/schedule/status"
import { isDateInDashboardPeriod } from "@/lib/dashboard/period-range"
import {
  filterDashboardAgendaAppointments,
  filterDashboardAgendaTasks,
  isDashboardAgendaDataFresh,
} from "@/lib/dashboard/agenda-entries"
import { getTodayYYYYMMDD } from "@/lib/time/tz-date"
import {
  AGENDA_STATUS_FILTERS,
  matchesAgendaStatusFilter,
  type AgendaStatusFilter,
} from "@/lib/dashboard/agenda-status"
import type { UserTaskDTO } from "@/lib/user-task/mapper"
import { useUserTasks } from "@/hooks/useUserTasks"
import { DASHBOARD_PANEL_BODY, DASHBOARD_PANEL_SHELL } from "./dashboard-panel-layout"
import { DaySectionHeader, groupByDay } from "./group-by-day"
import { useDashboard, type DashboardAgendaItem, type DashboardPeriod } from "./DashboardDataProvider"
import { TimelineAgendaSkeleton } from "./TimelineAgendaSkeleton"

const AGENDA_TITLE: Record<DashboardPeriod, string> = {
  day: "Agenda do dia",
  week: "Agenda da semana",
  month: "Agenda do mês",
}

const AGENDA_EMPTY: Record<DashboardPeriod, string> = {
  day: "Nenhum atendimento ou tarefa neste dia.",
  week: "Nenhum atendimento ou tarefa nesta semana.",
  month: "Nenhum atendimento ou tarefa neste mês.",
}

const AGENDA_EMPTY_FILTERED = "Nenhum item com este status."

const TASK_STATUS_LABEL: Record<UserTaskDTO["status"], string> = {
  pending: "Pendente",
  in_progress: "Em andamento",
  completed: "Concluída",
}

const TASK_STATUS_STYLE: Record<UserTaskDTO["status"], string> = {
  pending: "bg-amber-50 text-amber-700",
  in_progress: "bg-blue-50 text-blue-700",
  completed: "bg-emerald-50 text-emerald-700",
}

type TimelineEntry =
  | { kind: "appointment"; date: string; time: string; item: DashboardAgendaItem }
  | { kind: "task"; date: string; time: string; item: UserTaskDTO }

function compareTimelineEntries(a: TimelineEntry, b: TimelineEntry): number {
  const dateCompare = a.date.localeCompare(b.date)
  if (dateCompare !== 0) return dateCompare
  return a.time.localeCompare(b.time)
}

function buildTimelineEntries(
  appointments: DashboardAgendaItem[],
  tasks: UserTaskDTO[],
  period: DashboardPeriod,
  referenceDate: string,
  today: string
): TimelineEntry[] {
  const periodAppointments = filterDashboardAgendaAppointments(
    appointments,
    period,
    referenceDate,
    today
  )

  const periodTasks = filterDashboardAgendaTasks(tasks, period, referenceDate)

  const entries: TimelineEntry[] = [
    ...periodAppointments.map((item) => ({
      kind: "appointment" as const,
      date: item.date,
      time: item.time,
      item,
    })),
    ...periodTasks.map((item) => ({
      kind: "task" as const,
      date: item.date,
      time: item.time,
      item,
    })),
  ]

  return entries.sort(compareTimelineEntries)
}

function formatEntryCount(count: number, total?: number): string {
  if (total != null && total !== count) {
    return `${count} de ${total} ${total === 1 ? "item" : "itens"}`
  }
  return `${count} ${count === 1 ? "item" : "itens"}`
}

export function TimelineAgenda() {
  const { data, loading, period, referenceDate } = useDashboard()
  const { tasks: manualTasks, isLoading: tasksLoading } = useUserTasks()
  const [statusFilter, setStatusFilter] = useState<AgendaStatusFilter>("pending")
  const today = getTodayYYYYMMDD()

  const appointments =
    isDashboardAgendaDataFresh(data, period, referenceDate) && data
      ? data.periodAgenda
      : []
  const groupByDayEnabled = period === "week" || period === "month"
  const title = data?.calendarLabel
    ? `${AGENDA_TITLE[period]} · ${data.calendarLabel}`
    : AGENDA_TITLE[period]

  const allEntries = useMemo(
    () =>
      referenceDate
        ? buildTimelineEntries(appointments, manualTasks, period, referenceDate, today)
        : [],
    [appointments, manualTasks, period, referenceDate, today]
  )

  const entries = useMemo(
    () => allEntries.filter((entry) => matchesAgendaStatusFilter(statusFilter, entry)),
    [allEntries, statusFilter]
  )

  const dayGroups = useMemo(
    () => (groupByDayEnabled ? groupByDay(entries, (entry) => entry.date) : []),
    [entries, groupByDayEnabled]
  )

  const isLoading = loading || tasksLoading
  const emptyMessage =
    allEntries.length === 0 ? AGENDA_EMPTY[period] : AGENDA_EMPTY_FILTERED

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.35 }}
      whileHover={{ y: -2 }}
      className={cn("h-full min-h-0", DASHBOARD_PANEL_SHELL)}
    >
      <Card className="flex h-full min-h-0 flex-col overflow-hidden rounded-[20px] border-0 bg-white p-6 shadow-[0_2px_16px_rgba(0,0,0,0.05)]">
        <div className="mb-5 shrink-0 space-y-3">
          <div className="flex min-h-[1.75rem] items-start justify-between gap-2">
            <h3 className="line-clamp-2 min-w-0 flex-1 text-sm font-semibold leading-snug text-gray-600">
              {title}
            </h3>
            <div className="flex shrink-0 items-center gap-2">
              {allEntries.length > 0 ? (
                <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[10px] font-semibold text-gray-500">
                  {formatEntryCount(
                    statusFilter === "all" ? allEntries.length : entries.length,
                    statusFilter !== "all" ? allEntries.length : undefined
                  )}
                </span>
              ) : null}
              <Filter size={14} className="text-gray-400" aria-hidden />
            </div>
          </div>

          <div className="-mx-1 flex gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {AGENDA_STATUS_FILTERS.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setStatusFilter(item.value)}
                className={cn(
                  "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium transition-all duration-200",
                  statusFilter === item.value
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className={DASHBOARD_PANEL_BODY}>
          {isLoading ? (
            <TimelineAgendaSkeleton />
          ) : entries.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-center text-sm text-gray-400">{emptyMessage}</p>
            </div>
          ) : groupByDayEnabled ? (
            <div className="space-y-1">
              {dayGroups.map((group) => (
                <section key={group.date}>
                  <DaySectionHeader
                    label={group.label}
                    count={group.items.length}
                    countNoun={{ one: "item", other: "itens" }}
                  />
                  <div className="relative pl-1">
                    <div className="pointer-events-none absolute left-[52px] top-0 bottom-0 w-px bg-gray-200" />
                    {group.items.map((entry) => (
                      <TimelineRow key={`${entry.kind}-${entry.item.id}`} entry={entry} />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <div className="relative">
              <div className="pointer-events-none absolute left-[52px] top-0 bottom-0 w-px bg-gray-200" />
              <div className="space-y-1">
                {entries.map((entry) => (
                  <TimelineRow key={`${entry.kind}-${entry.item.id}`} entry={entry} />
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  )
}

function TimelineRow({ entry }: { entry: TimelineEntry }) {
  return (
    <div className="relative">
      <div className="flex gap-3">
        <span className="w-12 shrink-0 pt-3 text-xs font-medium text-gray-400">{entry.time}</span>
        <div className="flex-1 pb-3">
          {entry.kind === "appointment" ? (
            <AppointmentEventCard item={entry.item} />
          ) : (
            <TaskEventCard item={entry.item} />
          )}
        </div>
      </div>
    </div>
  )
}

function AppointmentEventCard({ item }: { item: DashboardAgendaItem }) {
  return (
    <motion.div
      whileHover={{ scale: 1.02, x: 4 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className="rounded-2xl border border-gray-100 bg-white p-3.5 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-primary">
          <HiOutlineUser className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-sm font-semibold text-gray-600">{item.patientName}</p>
            <span
              className={cn(
                "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium",
                STATUS_STYLE[item.status] ?? "bg-gray-100 text-gray-600"
              )}
            >
              {item.statusLabel}
            </span>
          </div>
          {item.professionalName ? (
            <p className="text-xs text-gray-500">{item.professionalName}</p>
          ) : null}
          <p className="mt-1.5 text-xs font-medium text-gray-600">
            {item.time}
            {item.endTime ? ` – ${item.endTime}` : ""}
          </p>
        </div>
      </div>
    </motion.div>
  )
}

function TaskEventCard({ item }: { item: UserTaskDTO }) {
  return (
    <motion.div
      whileHover={{ scale: 1.02, x: 4 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className="rounded-2xl border border-violet-100 bg-violet-50/40 p-3.5 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-700">
          <HiOutlineClipboardList className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-sm font-semibold text-gray-600">{item.title}</p>
            <span
              className={cn(
                "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium",
                TASK_STATUS_STYLE[item.status]
              )}
            >
              {TASK_STATUS_LABEL[item.status]}
            </span>
          </div>
          {item.description ? (
            <p className="text-xs text-gray-500">{item.description}</p>
          ) : (
            <p className="text-xs text-gray-500">Tarefa manual</p>
          )}
          <p className="mt-1.5 text-xs font-medium text-gray-600">{item.time}</p>
        </div>
      </div>
    </motion.div>
  )
}
