"use client"

import { useMemo } from "react"
import type { Appointment } from "@/types/types"
import { flattenAppointmentsByDay } from "@/lib/schedule/group-by-day"
import { Table } from "@/components/ui/table/table"

type Props = {
  data: Appointment[]
  setData: React.Dispatch<React.SetStateAction<Appointment[]>>
}

export function ScheduleView({ data, setData }: Props) {
  const rows = useMemo(() => flattenAppointmentsByDay(data), [data])

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col">
      <Table rows={rows} setData={setData} />
    </div>
  )
}
