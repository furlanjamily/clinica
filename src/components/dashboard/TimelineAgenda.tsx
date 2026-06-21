"use client"

import { useMemo } from "react"
import { motion } from "framer-motion"
import { HiOutlineUser } from "react-icons/hi"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { STATUS_STYLE } from "@/lib/schedule/status"
import {
  DASHBOARD_PANEL_BODY_H,
  DASHBOARD_PANEL_EMPTY_MIN,
  DASHBOARD_PANEL_SCROLL,
} from "./dashboard-panel-layout"
import { DaySectionHeader, groupByDay } from "./group-by-day"
import { useDashboard, type DashboardAgendaItem, type DashboardPeriod } from "./DashboardDataProvider"

const AGENDA_TITLE: Record<DashboardPeriod, string> = {
  today: "Agenda de hoje",
  week: "Agenda da semana",
  month: "Agenda do mês",
}

const AGENDA_EMPTY: Record<DashboardPeriod, string> = {
  today: "Nenhum atendimento agendado para hoje.",
  week: "Nenhum atendimento agendado nesta semana.",
  month: "Nenhum atendimento agendado neste mês.",
}

export function TimelineAgenda() {
  const { data, loading, period } = useDashboard()
  const agenda = data?.periodAgenda ?? []
  const groupByDayEnabled = period === "week" || period === "month"
  const isEmpty = !loading && agenda.length === 0

  const dayGroups = useMemo(
    () => (groupByDayEnabled ? groupByDay(agenda, (item) => item.date) : []),
    [agenda, groupByDayEnabled]
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.35 }}
      whileHover={{ y: -2 }}
      className={cn("flex flex-col", isEmpty && "lg:flex-1")}
    >
      <Card
        className={cn(
          "flex flex-col rounded-[20px] border-0 bg-white p-6 shadow-[0_2px_16px_rgba(0,0,0,0.05)]",
          isEmpty ? "h-full lg:flex-1" : "overflow-hidden"
        )}
      >
        <div className="mb-5 flex shrink-0 items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-600">{AGENDA_TITLE[period]}</h3>
          {agenda.length > 0 ? (
            <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[10px] font-semibold text-gray-500">
              {agenda.length} {agenda.length === 1 ? "consulta" : "consultas"}
            </span>
          ) : null}
        </div>

        <div
          className={cn(
            "relative",
            DASHBOARD_PANEL_SCROLL,
            isEmpty ? cn("flex-1", DASHBOARD_PANEL_EMPTY_MIN) : DASHBOARD_PANEL_BODY_H
          )}
        >
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-center text-sm text-gray-400">Carregando agenda...</p>
            </div>
          ) : agenda.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-center text-sm text-gray-400">{AGENDA_EMPTY[period]}</p>
            </div>
          ) : groupByDayEnabled ? (
            <div className="space-y-1">
              {dayGroups.map((group) => (
                <section key={group.date}>
                  <DaySectionHeader
                    label={group.label}
                    count={group.items.length}
                    countNoun={{ one: "consulta", other: "consultas" }}
                  />
                  <div className="relative pl-1">
                    <div className="pointer-events-none absolute left-[52px] top-0 bottom-0 w-px bg-gray-200" />
                    {group.items.map((item) => (
                      <AgendaRow key={item.id} item={item} />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <div className="relative">
              <div className="pointer-events-none absolute left-[52px] top-0 bottom-0 w-px bg-gray-200" />
              <div className="space-y-1">
                {agenda.map((item) => (
                  <AgendaRow key={item.id} item={item} />
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  )
}

function AgendaRow({ item }: { item: DashboardAgendaItem }) {
  return (
    <div className="relative">
      <div className="flex gap-3">
        <span className="w-12 shrink-0 pt-3 text-xs font-medium text-gray-400">{item.time}</span>
        <div className="flex-1 pb-3">
          <TimelineEventCard item={item} />
        </div>
      </div>
    </div>
  )
}

function TimelineEventCard({ item }: { item: DashboardAgendaItem }) {
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
