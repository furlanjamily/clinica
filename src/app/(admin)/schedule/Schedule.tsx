"use client"

import { GlobalFilters, FilterField } from "@/components/ui/table/GlobalFilters"
import { useSchedule } from "@/hooks/useSchedule"
import type { Atendimento } from "@/types/types"
import { ScheduleNavigator } from "./components/ScheduleNavigator"
import { ScheduleView } from "./views/ScheduleView"
import { Header } from "@/components/ui/PageHeader"

type Props = {
  data: Atendimento[]
  onChangeData: React.Dispatch<React.SetStateAction<Atendimento[]>>
}

const FILTER_CONFIG = [
  {
    name: "status",
    type: "select",
    options: [
      { value: "", label: "Todos os status" },
      { value: "Agendado", label: "Agendado" },
      { value: "AguardandoConfirmacao", label: "Aguardando Confirmação" },
      { value: "Confirmado", label: "Confirmado" },
      { value: "Em Atendimento", label: "Em Atendimento" },
      { value: "Reagendado", label: "Reagendado" },
      { value: "Cancelado", label: "Cancelado" },
      { value: "Concluido", label: "Concluído" },
    ],
  },
  {
    name: "atendimento",
    type: "select",
    options: [
      { value: "", label: "Todos os tipos" },
      { value: "Consulta", label: "Consulta" },
      { value: "Retorno", label: "Retorno" },
    ],
  },
  {
    name: "paciente",
    type: "input",
    placeholder: "Paciente...",
  },
  {
    name: "profissional",
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
    <div className="flex flex-col h-full min-h-0">
      <div className="flex flex-col gap-6">
        <Header title="Agenda" />

        <div className="flex items-center justify-between gap-4 flex-wrap">
          <ScheduleNavigator
            date={date}
            view={view}
            onChangeDate={setDate}
            onChangeView={handleViewChange}
          />
        </div>

        <GlobalFilters
          values={filters}
          onChange={(name, value) => handleFilterChange(name as keyof typeof filters, value)}
          filters={FILTER_CONFIG}
        />
      </div>

      <main className="flex-1 min-h-0 overflow-hidden mt-4">
        <ScheduleView
          data={filteredData}
          setData={onChangeData}
        />
      </main>
    </div>
  )
}
