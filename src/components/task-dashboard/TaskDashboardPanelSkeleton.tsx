"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { DASHBOARD_PANEL_BODY, DASHBOARD_PANEL_SHELL } from "@/components/dashboard/dashboard-panel-layout"

export function TaskDashboardPanelSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className={cn(
        "h-full min-h-0",
        DASHBOARD_PANEL_SHELL,
        "w-full min-w-0 rounded-[20px] border border-gray-200 bg-white p-5 sm:p-6"
      )}
    >
      <div className="mb-4 shrink-0 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="space-y-2">
            <div className="h-5 w-36 rounded bg-gray-200 animate-pulse" />
            <div className="h-3 w-20 rounded bg-gray-100 animate-pulse" />
          </div>
          <div className="h-4 w-4 rounded bg-gray-100 animate-pulse" />
        </div>
        <div className="flex gap-1.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-7 w-16 shrink-0 rounded-full bg-gray-100 animate-pulse" />
          ))}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        <div className="relative flex min-h-0 flex-1 flex-col">
          <motion.div className="relative flex min-h-0 flex-1 flex-col rounded-[24px] bg-primary p-4">
            <div className="mb-4 flex shrink-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-2">
                <div className="h-5 w-32 rounded bg-white/25 animate-pulse" />
                <div className="h-3 w-24 rounded bg-white/15 animate-pulse" />
              </div>
              <div className="flex items-center gap-2">
                <div className="h-8 w-20 rounded-full bg-white/20 animate-pulse" />
                <div className="h-8 w-8 rounded-full bg-white/25 animate-pulse" />
              </div>
            </div>

            <div className={cn(DASHBOARD_PANEL_BODY, "space-y-2")}>
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-2xl bg-white/10 px-3 py-2.5"
                >
                  <div className="h-7 w-7 shrink-0 rounded-full bg-white/20 animate-pulse" />
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="h-4 w-40 rounded bg-white/25 animate-pulse" />
                    <div className="h-3 w-28 rounded bg-white/15 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}
