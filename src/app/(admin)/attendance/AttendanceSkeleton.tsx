import { TableSkeleton } from "@/components/ui/TableSkeleton"
import { TableCard } from "@/components/ui/table/DataTable"
import {
  attendanceMobileRootClass,
  attendanceTopSectionClass,
  attendanceHistorySectionClass,
  attendanceFilterTableClass,
  attendanceHistoryPanelClass,
} from "@/lib/layout/filter-table-layout"

function Pulse({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-gray-200 ${className ?? ""}`} />
}

export function AttendanceSkeleton() {
  return (
    <div className={attendanceMobileRootClass}>
      <section className={attendanceTopSectionClass}>
        <Pulse className="h-3 w-44" />

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:grid-rows-[auto_1fr]">
          <div className="min-w-0 lg:col-start-1 lg:row-start-1">
            <div className="flex min-w-0 items-center gap-3 rounded-3xl border border-gray-200 bg-white p-4 sm:p-5">
              <div className="min-w-0 flex-1 overflow-x-auto [scrollbar-width:thin]">
                <div className="flex w-max min-w-full flex-nowrap items-center gap-x-6 sm:gap-x-8">
                  <Pulse className="h-6 w-36 shrink-0" />
                  <div className="shrink-0 space-y-1.5">
                    <Pulse className="h-2.5 w-20" />
                    <Pulse className="h-4 w-10" />
                  </div>
                  <div className="shrink-0 space-y-1.5">
                    <Pulse className="h-2.5 w-12" />
                    <Pulse className="h-4 w-24" />
                  </div>
                  <div className="shrink-0 space-y-1.5">
                    <Pulse className="h-2.5 w-14" />
                    <Pulse className="h-4 w-16" />
                  </div>
                </div>
              </div>
              <Pulse className="h-16 w-16 shrink-0 rounded-xl" />
            </div>
          </div>

          <div className="w-full lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:w-auto lg:shrink-0">
            <div className="relative flex w-full flex-col items-center justify-between gap-2 rounded-3xl border border-gray-200 bg-white p-3 lg:h-64 lg:w-64">
              <Pulse className="absolute right-2.5 top-2.5 h-8 w-8 rounded-lg" />
              <Pulse className="h-20 w-28 rounded-xl" />
              <div className="flex w-full flex-wrap items-center justify-center gap-2">
                <Pulse className="h-9 w-20 rounded-xl" />
                <Pulse className="h-9 w-24 rounded-xl" />
              </div>
            </div>
          </div>

          <div className="flex w-full min-w-0 justify-center lg:col-start-1 lg:row-start-2 lg:min-h-0 lg:items-center lg:justify-start lg:self-stretch lg:px-3">
            <div className="flex w-full max-w-full flex-col items-center gap-3 lg:items-start">
              <div className="flex items-center justify-center gap-2">
                <Pulse className="h-9 w-9 rounded-xl" />
                <Pulse className="h-9 w-40 rounded-xl" />
                <Pulse className="h-9 w-9 rounded-xl" />
              </div>
              <div className="flex justify-center gap-1 rounded-xl border border-gray-200 bg-white p-1">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Pulse key={i} className="h-8 w-14 rounded-lg" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={attendanceHistorySectionClass}>
        <Pulse className="h-3 w-40 shrink-0" />

        <div className={attendanceFilterTableClass}>
          <div className="flex shrink-0 flex-col justify-center gap-3 rounded-3xl border border-gray-200 bg-white p-4 sm:p-5">
            <div className="flex items-center gap-2 px-2 py-2 lg:hidden">
              <Pulse className="h-4 w-4 rounded" />
              <Pulse className="h-4 w-14" />
            </div>
            <div className="hidden flex-wrap gap-3 px-2 pb-2 lg:flex">
              <Pulse className="h-9 w-24 rounded-xl" />
              <Pulse className="h-9 w-36 rounded-xl" />
              <Pulse className="h-9 w-32 rounded-xl" />
              <Pulse className="h-9 w-28 rounded-xl" />
            </div>
          </div>

          <div className={attendanceHistoryPanelClass}>
            <TableCard className="h-full min-h-0">
              <div className="p-2 sm:p-3">
                <TableSkeleton cols={5} rows={4} />
              </div>
            </TableCard>
          </div>
        </div>
      </section>
    </div>
  )
}
