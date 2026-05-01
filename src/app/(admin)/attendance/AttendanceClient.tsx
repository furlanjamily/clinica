"use client"

import { useAuth } from "@/hooks/useAuth"
import type { Atendimento } from "@/types/types"
import { AttendanceTable } from "./AttendanceTable"
import { MedicalRecord } from "@/types"
import { Header } from "@/components/ui/PageHeader"
import { useScheduleQuery } from "@/hooks/useScheduleQuery"
import { TableSkeleton } from "@/components/ui/TableSkeleton"

type HistoryItem = Atendimento & {
  duracao?: string
  record?: MedicalRecord
}

function formatMs(ms: number) {
  const totalSec = Math.floor(ms / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
    .toString()
    .padStart(2, "0")
  const s = (totalSec % 60).toString().padStart(2, "0")
  return h > 0 ? `${h}:${m}:${s}` : `${m}:${s}`
}

export function AttendanceClient() {
  const { session, isSuperAdmin } = useAuth()
  const username = session?.user?.name ?? ""
  const role = session?.user?.role ?? ""

  const { data: allData, isLoading } = useScheduleQuery()

  const active: Atendimento[] = (allData ?? []).filter(
    (item) => item.status === "Em Atendimento"
  )

  const completed = (allData ?? []).filter((item) => item.status === "Concluido")

  const history: HistoryItem[] = (
    isSuperAdmin
      ? completed
      : completed.filter((item) =>
          item.profissionalNome?.toLowerCase().includes(username.toLowerCase())
        )
  ).map((item) => ({
    ...item,
    duracao: item.accumulatedTime ? formatMs(item.accumulatedTime) : "—",
    record: item.prontuario ?? undefined,
  }))

  return (
    <div className="flex flex-col h-full min-h-0 gap-6">
      <Header title="Atendimentos" />

      {isLoading ? (
        <TableSkeleton cols={5} rows={4} />
      ) : (
        <AttendanceTable
          data={active}
          history={history}
          loadingHistory={false}
          isSuperAdmin={role === "SUPER_ADMIN"}
        />
      )}
    </div>
  )
}
