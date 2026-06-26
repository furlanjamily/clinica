"use client"

import { useMemo, useState } from "react"
import type { Appointment } from "@/types/types"
import { flattenAppointmentsByDay } from "@/lib/schedule/group-by-day"
import { Table } from "@/components/ui/table/table"
import { filterTablePanelInnerClass } from "@/lib/layout/filter-table-layout"
import { PAGE_SIZE_OPTIONS } from "@/components/ui/table/TablePagination"

type Props = {
  data: Appointment[]
  setData: React.Dispatch<React.SetStateAction<Appointment[]>>
}

export function ScheduleView({ data, setData }: Props) {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZE_OPTIONS[0])

  const total = data.length
  const safePage = Math.min(page, Math.max(1, Math.ceil(total / pageSize)))

  const pageData = useMemo(
    () => data.slice((safePage - 1) * pageSize, safePage * pageSize),
    [data, safePage, pageSize]
  )

  const rows = useMemo(() => flattenAppointmentsByDay(pageData), [pageData])

  return (
    <div className={filterTablePanelInnerClass}>
      <Table
        rows={rows}
        appointments={data}
        setData={setData}
        pagination={
          total > 0
            ? {
                page: safePage,
                pageSize,
                total,
                onPageChange: setPage,
                onPageSizeChange: (size) => {
                  setPageSize(size)
                  setPage(1)
                },
              }
            : undefined
        }
      />
    </div>
  )
}
 