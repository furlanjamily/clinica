import { Suspense } from "react"
import { AttendanceClient } from "./AttendanceClient"
import { AttendanceSkeleton } from "./AttendanceSkeleton"
import { Header } from "@/components/ui/PageHeader"
import { attendancePageClass } from "@/lib/layout/filter-table-layout"
import { cn } from "@/lib/utils"

export default function AttendancePage() {
  return (
    <div className={cn(attendancePageClass, "gap-4 sm:gap-3")}>
      <div className="shrink-0">
        <Header title="Atendimentos" />
      </div>
      <Suspense fallback={<AttendanceSkeleton />}>
        <AttendanceClient />
      </Suspense>
    </div>
  )
}
