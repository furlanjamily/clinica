"use client"

import { cn } from "@/lib/utils"
import {
  DASHBOARD_CALENDAR_BODY_MONTH,
  DASHBOARD_CALENDAR_BODY_WEEK,
} from "./dashboard-panel-layout"

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]

export function CalendarCardSkeleton({ mode = "week" }: { mode?: "week" | "month" }) {
  const cellCount = mode === "month" ? 42 : 7

  return (
    <>
      <div className="mb-5 flex items-center justify-between">
        <div className="h-5 w-36 rounded bg-gray-200 animate-pulse" />
        <div className="flex items-center gap-1">
          <div className="h-8 w-8 rounded-full bg-gray-100 animate-pulse" />
          <div className="h-8 w-8 rounded-full bg-gray-100 animate-pulse" />
        </div>
      </div>

      {mode === "month" ? (
        <div className={DASHBOARD_CALENDAR_BODY_MONTH}>
          {WEEKDAYS.map((day) => (
            <span key={day} className="pb-2 text-xs font-medium text-gray-400">
              {day}
            </span>
          ))}
          {Array.from({ length: cellCount }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className="mx-auto h-9 w-9 rounded-full bg-gray-100 animate-pulse" />
              <div className="h-1.5 w-1.5 rounded-full bg-transparent" />
            </div>
          ))}
        </div>
      ) : (
        <div className={DASHBOARD_CALENDAR_BODY_WEEK}>
          {WEEKDAYS.map((day) => (
            <span key={day} className="pb-2 text-xs font-medium text-gray-400">
              {day}
            </span>
          ))}
          {Array.from({ length: cellCount }).map((_, i) => (
            <div key={i} className={cn("flex flex-col items-center gap-1")}>
              <div className="mx-auto h-9 w-9 rounded-full bg-gray-100 animate-pulse" />
              <div className="h-1.5 w-1.5 rounded-full bg-transparent" />
            </div>
          ))}
        </div>
      )}
    </>
  )
}
