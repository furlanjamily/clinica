"use client"

import { RowType } from "@/types/rowType"
import type { Atendimento } from "@/types/types"
import { Table } from "@/components/ui/table/table"

type Props = {
  data: Atendimento[]
  setData: React.Dispatch<React.SetStateAction<Atendimento[]>>
}

function normalizeDate(date: string | number | Date) {
  if (date instanceof Date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate())
  }

  const [year, month, day] = String(date).split("-").map(Number)

  return new Date(year, month - 1, day)
}
function sortByTime(a: Atendimento, b: Atendimento) {
  return a.horario.localeCompare(b.horario)
}

export function ScheduleView({ data, setData }: Props) {
  const grouped = data.reduce<Record<string, Record<string, Atendimento[]>>>(
    (acc, item) => {
      const date = normalizeDate(item.data)

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
    const dateA = new Date(a[1][Object.keys(a[1])[0]][0].data)
    const dateB = new Date(b[1][Object.keys(b[1])[0]][0].data)
    return dateA.getTime() - dateB.getTime()
  })

  const flattenedData: RowType[] = []

  sortedMonths.forEach(([_month, days]) => {
    const sortedDays = Object.entries(days).sort((a, b) => {
      const dateA = new Date(a[1][0].data)
      const dateB = new Date(b[1][0].data)
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
