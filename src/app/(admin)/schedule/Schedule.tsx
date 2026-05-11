"use client"

import { GlobalFilters, FilterField } from "@/components/ui/table/GlobalFilters"
import { Collapse } from "@/components/ui/Collapse"
import { useSchedule } from "@/hooks/useSchedule"
import type { Appointment } from "@/types/types"
import { ScheduleNavigator } from "./components/ScheduleNavigator"
import { ScheduleView } from "./views/ScheduleView"
import { Header } from "@/components/ui/PageHeader"

type Props = {
  data: Appointment[]
  onChangeData: React.Dispatch<React.SetStateAction<Appointment[]>>
}

const FILTER_CONFIG = [
  {
    name: "status",
    type: "select",
    options: [
      { value: "", label: "Todos os status" },
      { value: "Agendado", label: "Agendado" },
      { value: "AguardandoConfirmacao", label: "Aguardando confirmação" },
      { value: "Confirmado", label: "Confirmado" },
      { value: "Em Atendimento", label: "Em Atendimento" },
      { value: "Reagendado", label: "Reagendado" },
      { value: "Cancelado", label: "Cancelado" },
      { value: "Concluido", label: "Concluído" },
    ],
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
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex flex-col gap-4 sm:gap-6">
        <Header title="Agenda" />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <ScheduleNavigator
            date={date}
            view={view}
            onChangeDate={setDate}
            onChangeView={handleViewChange}
          />
        </div>

        <Collapse label="Filtros">
          <GlobalFilters
            values={filters}
            onChange={(name, value) => handleFilterChange(name as keyof typeof filters, value)}
            filters={FILTER_CONFIG}
          />
        </Collapse>
      </div>

      <main className="mt-3 min-h-0 min-w-0 flex-1 overflow-auto sm:mt-4">
        <ScheduleView data={filteredData} setData={onChangeData} />
      </main>
    </div>
  )
}
