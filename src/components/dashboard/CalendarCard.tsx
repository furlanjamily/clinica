"use client"

import { motion } from "framer-motion"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { useDashboard } from "./DashboardDataProvider"

export function CalendarCard() {
  const { data, period } = useDashboard()
  const calendarLabel = data?.calendarLabel ?? "—"
  const calendar = data?.calendar ?? []
  const mode = data?.calendarMode ?? "week"

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      whileHover={{ y: -2 }}
      className="shrink-0"
    >
      <Card className="rounded-[20px] border-0 bg-white p-6 shadow-[0_2px_16px_rgba(0,0,0,0.05)]">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-600">{calendarLabel}</h3>
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label="Período anterior"
              className="flex h-8 w-8 items-center justify-center rounded-full text-gray-600 transition-colors hover:bg-gray-100"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              aria-label="Próximo período"
              className="flex h-8 w-8 items-center justify-center rounded-full text-gray-600 transition-colors hover:bg-gray-100"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {mode === "month" ? (
          <div className="grid grid-cols-7 gap-1 text-center">
            {WEEKDAYS.map((day) => (
              <span key={day} className="pb-2 text-xs font-medium text-gray-400">
                {day}
              </span>
            ))}
            {calendar.map((d, i) =>
              d.date ? (
                <div key={d.date} className="flex flex-col items-center gap-1">
                  <button
                    type="button"
                    className={cn(
                      "mx-auto flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium transition-all",
                      d.isToday
                        ? "bg-[#8538F0] text-white shadow-md"
                        : "text-gray-500 hover:bg-gray-100"
                    )}
                    title={d.count > 0 ? `${d.count} agendamento(s)` : "Sem agendamentos"}
                  >
                    {d.day}
                  </button>
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      d.count > 0
                        ? d.isToday
                          ? "bg-[#8538F0]"
                          : "bg-[#C4A0FF]"
                        : "bg-transparent"
                    )}
                  />
                </div>
              ) : (
                <div key={`empty-${i}`} className="h-9" />
              )
            )}
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-1 text-center">
            {calendar.map((d) =>
              d.date ? (
                <span key={`h-${d.date}`} className="pb-2 text-xs font-medium text-gray-400">
                  {d.weekday}
                </span>
              ) : null
            )}
            {calendar.map((d) =>
              d.date ? (
                <div key={d.date} className="flex flex-col items-center gap-1">
                  <button
                    type="button"
                    className={cn(
                      "mx-auto flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium transition-all",
                      d.isToday
                        ? "bg-[#8538F0] text-white shadow-md"
                        : d.inPeriod === false
                          ? "text-gray-300"
                          : "text-gray-500 hover:bg-gray-100",
                      period === "today" && !d.isToday && "opacity-40"
                    )}
                    title={d.count > 0 ? `${d.count} agendamento(s)` : "Sem agendamentos"}
                  >
                    {d.day}
                  </button>
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      d.count > 0
                        ? d.isToday
                          ? "bg-[#8538F0]"
                          : "bg-[#C4A0FF]"
                        : "bg-transparent"
                    )}
                  />
                </div>
              ) : null
            )}
          </div>
        )}
      </Card>
    </motion.div>
  )
}

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]
