"use client"

import { GlobalFilters, FilterField } from "@/components/ui/table/GlobalFilters"
import { Collapse } from "@/components/ui/Collapse"
import { useSchedule } from "@/hooks/useSchedule"
import type { Appointment } from "@/types/types"
import { ScheduleNavigator } from "./components/ScheduleNavigator"
import { ScheduleView } from "./views/ScheduleView"
import { Header } from "@/components/ui/PageHeader"
import { AppointmentStatus, STATUS_LABEL } from "@/lib/schedule/status"

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
    <div className="flex h-full min-h-0 min-w-0 max-w-full flex-col">
      <Header title="Agenda" />

      <div className="mt-3 flex min-h-0 min-w-0 flex-1 flex-col gap-3 overflow-hidden sm:mt-4 sm:gap-4">
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3">
          <ScheduleNavigator
            date={date}
            view={view}
            onChangeDate={setDate}
            onChangeView={handleViewChange}
          />
        </div>

        <div className="flex shrink-0 flex-col justify-center gap-3 rounded-3xl border border-gray-200 bg-white p-4 sm:p-5">
          <Collapse label="Filtros" unboundedPanel>
            <GlobalFilters
              values={filters}
              onChange={(name, value) => handleFilterChange(name as keyof typeof filters, value)}
              filters={FILTER_CONFIG}
            />
          </Collapse>
        </div>

        <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <ScheduleView data={filteredData} setData={onChangeData} />
        </main>
      </div>
    </div>
  )
}
