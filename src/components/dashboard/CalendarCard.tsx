"use client"

import { motion } from "framer-motion"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { useDashboard } from "./DashboardDataProvider"
import { DASHBOARD_CALENDAR_BODY_MONTH, DASHBOARD_CALENDAR_BODY_WEEK } from "./dashboard-panel-layout"
import { CalendarCardSkeleton } from "./CalendarCardSkeleton"

export function CalendarCard() {
  const { data, period, loading, navigatePrevious, navigateNext, selectDay } = useDashboard()
  const calendarLabel = data?.calendarLabel ?? "—"
  const calendar = data?.calendar ?? []
  const mode = data?.calendarMode ?? (period === "month" ? "month" : "week")

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      whileHover={{ y: -2 }}
      className="shrink-0"
    >
      <Card className="rounded-[20px] border-0 bg-white p-6 shadow-[0_2px_16px_rgba(0,0,0,0.05)]">
        {loading ? (
          <CalendarCardSkeleton mode={mode} />
        ) : (
          <>
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-600">{calendarLabel}</h3>
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label="Período anterior"
              onClick={navigatePrevious}
              className="flex h-8 w-8 items-center justify-center rounded-full text-gray-600 transition-colors hover:bg-gray-100"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              aria-label="Próximo período"
              onClick={navigateNext}
              className="flex h-8 w-8 items-center justify-center rounded-full text-gray-600 transition-colors hover:bg-gray-100"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {mode === "month" ? (
          <div className={DASHBOARD_CALENDAR_BODY_MONTH}>
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
          <div className={DASHBOARD_CALENDAR_BODY_WEEK}>
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
                    disabled={period === "day" && d.isSelected}
                    onClick={
                      period === "day" && d.date
                        ? () => selectDay(d.date!)
                        : undefined
                    }
                    className={cn(
                      "mx-auto flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium transition-all",
                      period === "day" && d.isSelected
                        ? "bg-[#8538F0] text-white shadow-md"
                        : period !== "day" && d.isToday
                          ? "bg-[#8538F0] text-white shadow-md"
                          : period === "day" && d.isToday
                            ? "ring-2 ring-[#8538F0]/30 text-gray-600"
                            : d.inPeriod === false
                              ? "text-gray-300"
                              : "text-gray-500 hover:bg-gray-100",
                      period === "day" && !d.isSelected && "opacity-40 hover:opacity-100",
                      period === "day" && !d.isSelected && "cursor-pointer"
                    )}
                    title={d.count > 0 ? `${d.count} agendamento(s)` : "Sem agendamentos"}
                  >
                    {d.day}
                  </button>
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      d.count > 0
                        ? period === "day" && d.isSelected
                          ? "bg-[#8538F0]"
                          : d.isToday
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
          </>
        )}
      </Card>
    </motion.div>
  )
}

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]
