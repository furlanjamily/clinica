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

function DashboardMainGrid() {
  const { period } = useDashboard()
  const panelHeight = getDashboardPanelHeight(period)

  return (
    <div className="grid grid-cols-1 items-stretch gap-5 sm:gap-6 lg:grid-cols-[1fr_300px] xl:grid-cols-[1fr_320px]">
      <div className="flex min-h-0 min-w-0 flex-col gap-5 sm:gap-6 lg:min-h-0">
        <CalendarCard />
        <div
          className={DASHBOARD_PANELS_GRID}
          style={{ gridTemplateRows: `repeat(2, ${panelHeight}px)` }}
        >
          <TimelineAgenda />
          <TaskDashboardPanel />
        </div>
      </div>

      <div className="flex min-h-0 min-w-0 flex-col gap-5 sm:gap-6 lg:h-full">
        <FeaturedDoctorCard />
        <LastVisitDetails />
        <ProjectProgressCard />
      </div>
    </div>
  )
}

export function DashboardPage() {
  return (
    <DashboardDataProvider>
      <div className="min-h-full">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col gap-5 px-6"
        >
          <UserHeader />
          <DashboardWelcomeBar />

          <ProjectOverviewCards />

          <DashboardMainGrid />
        </motion.div>
      </div>
    </DashboardDataProvider>
  )
}
