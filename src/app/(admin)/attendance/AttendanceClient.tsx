"use client"

import { useSuspenseQuery } from "@tanstack/react-query"
import { useAuth } from "@/hooks/useAuth"
import { useSchedule, type ViewMode } from "@/hooks/useSchedule"
import { SCHEDULE_QUERY_KEY, fetchSchedule } from "@/hooks/useScheduleQuery"
import { AppointmentStatus } from "@/lib/schedule/status"
import type { Appointment } from "@/types/types"
import { AttendanceTable } from "./AttendanceTable"

export function AttendanceClient() {
  const { isSuperAdmin } = useAuth()

  const { data: allData } = useSuspenseQuery<Appointment[]>({
    queryKey: SCHEDULE_QUERY_KEY,
    queryFn: () => fetchSchedule().catch(() => []),
  })

  const {
    date,
    view,
    setDate,
    setView,
    filteredData: inPeriod,
  } = useSchedule(allData)

  function handleViewChange(v: ViewMode) {
    setView(v)
    setDate(new Date())
  }

  const active = allData.filter((item) => item.status === AppointmentStatus.InProgress)
  const completed = inPeriod.filter((item) => item.status === AppointmentStatus.Completed)

  return (
    <AttendanceTable
      data={active}
      history={completed}
      loadingHistory={false}
      isSuperAdmin={isSuperAdmin}
      date={date}
      view={view}
      onChangeDate={setDate}
      onChangeView={handleViewChange}
    />
  )
}
