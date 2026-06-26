"use client"

import { motion } from "framer-motion"
import { ProjectOverviewCards } from "./ProjectOverviewCards"
import { FeaturedDoctorCard } from "./FeaturedDoctorCard"
import { CalendarCard } from "./CalendarCard"
import { TimelineAgenda } from "./TimelineAgenda"
import { LastVisitDetails } from "./LastVisitDetails"
import { ProjectProgressCard } from "./ProjectProgressCard"
import { DASHBOARD_PANELS_GRID, getDashboardPanelHeight } from "./dashboard-panel-layout"
import { UserHeader } from "../ui/user-header"
import { TaskDashboardPanel } from "../task-dashboard/TaskDashboardPage"
import { DashboardWelcomeBar } from "./DashboardWelcomeBar"
import { DashboardDataProvider, useDashboard } from "./DashboardDataProvider"
import { cn } from "@/lib/utils"
import type { CSSProperties } from "react"

function DashboardMainGrid() {
  const { period } = useDashboard()
  const panelHeight = getDashboardPanelHeight(period)

  return (
    <div className="grid grid-cols-1 items-stretch gap-5 p-1 sm:gap-6 lg:grid-cols-[1fr_300px] xl:grid-cols-[1fr_320px]">
      <div className="flex min-h-0 min-w-0 flex-col gap-5 sm:gap-6 lg:min-h-0">
        <CalendarCard />
        <div
          className={cn(DASHBOARD_PANELS_GRID, "[grid-template-rows:repeat(2,var(--panel-height))]")}
          style={{ "--panel-height": `${panelHeight}px` } as CSSProperties}
        >
          <TimelineAgenda />
          <TaskDashboardPanel />
        </div>
      </div>

      <div className="flex min-h-0 min-w-0 flex-col gap-5 sm:gap-6 lg:h-full">
        <div className="hidden flex-col gap-5 sm:gap-6 lg:flex">
          <FeaturedDoctorCard />
          <LastVisitDetails />
        </div>
        <ProjectProgressCard />
      </div>
    </div>
  )
}

export function DashboardPage() {
  return (
    <DashboardDataProvider>
      <div className="h-full min-h-0 overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch] touch-pan-y">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col gap-5 px-6"
        >
          <UserHeader />
          <DashboardWelcomeBar />

          <ProjectOverviewCards />

          <div className="flex flex-col gap-5 sm:gap-6 lg:hidden">
            <FeaturedDoctorCard />
            <LastVisitDetails />
          </div>

          <DashboardMainGrid />
        </motion.div>
      </div>
    </DashboardDataProvider>
  )
}
