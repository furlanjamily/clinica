"use client"

import { RowType } from "@/types/rowType"
import type { Appointment } from "@/types/types"
import { Table } from "@/components/ui/table/table"

type Props = {
  data: Appointment[]
  setData: React.Dispatch<React.SetStateAction<Appointment[]>>
}

function normalizeDate(date: string | number | Date) {
  if (date instanceof Date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate())
  }

  const [year, month, day] = String(date).split("-").map(Number)

  return new Date(year, month - 1, day)
}
function sortByTime(a: Appointment, b: Appointment) {
  return a.slotTime.localeCompare(b.slotTime)
}

export function ScheduleView({ data, setData }: Props) {
  const grouped = data.reduce<Record<string, Record<string, Appointment[]>>>(
    (acc, item) => {
      const date = normalizeDate(item.date)

      const month = date.toLocaleDateString("pt-BR", {
        month: "long",
        year: "numeric",
      })

      const day = date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
      })

      if (!acc[month]) acc[month] = {}
      if (!acc[month][day]) acc[month][day] = []

      acc[month][day].push(item)

      return acc
    },
    {}
  )

  const sortedMonths = Object.entries(grouped).sort((a, b) => {
    const dateA = new Date(a[1][Object.keys(a[1])[0]][0].date)
    const dateB = new Date(b[1][Object.keys(b[1])[0]][0].date)
    return dateA.getTime() - dateB.getTime()
  })

  const flattenedData: RowType[] = []

  sortedMonths.forEach(([_month, days]) => {
    const sortedDays = Object.entries(days).sort((a, b) => {
      const dateA = new Date(a[1][0].date)
      const dateB = new Date(b[1][0].date)
      return dateA.getTime() - dateB.getTime()
    })

    sortedDays.forEach(([day, rows]) => {
      flattenedData.push({ type: "day", label: day })

      const orderedRows = [...rows].sort(sortByTime)

      orderedRows.forEach((item) => {
        flattenedData.push({
          ...item,
          type: "data",
        })
      })
    })
  })


  return (
    <div className="h-full min-h-0 overflow-auto">
      <Table rows={flattenedData} setData={setData} />
    </div>
  )
}
