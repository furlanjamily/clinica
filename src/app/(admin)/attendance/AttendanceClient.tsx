"use client"

import { useSuspenseQuery } from "@tanstack/react-query"
import { useAuth } from "@/hooks/useAuth"
import { useSchedule, type ViewMode } from "@/hooks/useSchedule"
import { SCHEDULE_QUERY_KEY, fetchSchedule } from "@/hooks/useScheduleQuery"
import { AppointmentStatus } from "@/lib/schedule/status"
import type { Appointment } from "@/types/types"
import { AttendanceTable } from "./AttendanceTable"

export function AttendanceClient() {
  const { session, isSuperAdmin } = useAuth()
  const username = session?.user?.name ?? ""
  const role = session?.user?.role ?? ""

  const { data: allData } = useSuspenseQuery<Appointment[]>({
    queryKey: SCHEDULE_QUERY_KEY,
    // Suspense + lista vazia em caso de falha (evita quebrar a página inteira)
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

  // Em andamento independe do período selecionado no navegador de datas
  const active = allData.filter((item) => item.status === AppointmentStatus.InProgress)
  const completed = inPeriod.filter((item) => item.status === AppointmentStatus.Completed)

  const history = isSuperAdmin
    ? completed
    : completed.filter((item) =>
        item.professionalName?.toLowerCase().includes(username.toLowerCase())
      )

  return (
    <AttendanceTable
      data={active}
      history={history}
      loadingHistory={false}
      isSuperAdmin={role === "SUPER_ADMIN"}
      date={date}
      view={view}
      onChangeDate={setDate}
      onChangeView={handleViewChange}
    />
  )
}
