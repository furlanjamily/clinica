"use client"

import { GlobalFilters, FilterField } from "@/components/ui/table/GlobalFilters"
import { Collapse } from "@/components/ui/Collapse"
import { useSchedule } from "@/hooks/useSchedule"
import type { Appointment } from "@/types/types"
import { ScheduleNavigator } from "./components/ScheduleNavigator"
import { ScheduleView } from "./views/ScheduleView"
import { Header } from "@/components/ui/PageHeader"
import {
  filterTableBodyClass,
  filterTableFiltersClass,
  filterTablePageClass,
  filterTablePanelClass,
} from "@/lib/layout/filter-table-layout"
import { AppointmentStatus, STATUS_LABEL } from "@/lib/schedule/status"
import { cn } from "@/lib/utils"

const STATUS_FILTER_OPTIONS = [
  { value: "", label: "Todos os status" },
  ...Object.values(AppointmentStatus).map((status) => ({
    value: status,
    label: STATUS_LABEL[status] ?? status,
  })),
]

type Props = {
  data: Appointment[]
  onChangeData: React.Dispatch<React.SetStateAction<Appointment[]>>
}

const FILTER_CONFIG = [
  {
    name: "id",
    type: "input",
    placeholder: "ID...",
  },
  {
    name: "date",
    type: "date",
    placeholder: "Data...",
  },
  {
    name: "status",
    type: "select",
    options: STATUS_FILTER_OPTIONS,
  },
  {
    name: "patient",
    type: "input",
    placeholder: "Paciente...",
  },
  {
    name: "professional",
    type: "input",
    placeholder: "Médico...",
  },
] satisfies FilterField[]

export default function Schedule({ data, onChangeData }: Props) {
  const {
    date,
    view,
    filters,
    setDate,
    setView,
    handleFilterChange,
    filteredData,
  } = useSchedule(data)

  function handleViewChange(v: typeof view) {
    setView(v)
    setDate(new Date())
  }

  return (
    <div className={filterTablePageClass}>
      <Header title="Agenda" />

      <div className={filterTableBodyClass}>
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3">
          <ScheduleNavigator
            date={date}
            view={view}
            onChangeDate={setDate}
            onChangeView={handleViewChange}
          />
        </div>

        <div
          className={cn(
            "flex flex-col justify-center gap-3 rounded-3xl border border-gray-200 bg-white p-4 sm:p-5",
            filterTableFiltersClass
          )}
        >
          <Collapse label="Filtros" unboundedPanel alwaysCollapsible>
            <GlobalFilters
              values={filters}
              onChange={(name, value) => handleFilterChange(name as keyof typeof filters, value)}
              filters={FILTER_CONFIG}
            />
          </Collapse>
        </div>

        <main className={filterTablePanelClass}>
          <ScheduleView data={filteredData} setData={onChangeData} />
        </main>
      </div>
    </div>
  )
}
