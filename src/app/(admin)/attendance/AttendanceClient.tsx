"use client"

import { useAuth } from "@/hooks/useAuth"
import type { Atendimento } from "@/types/types"
import { AttendanceTable } from "./AttendanceTable"
import { MedicalRecord } from "@/types"
import { useSuspenseQuery } from "@tanstack/react-query"
import { SCHEDULE_QUERY_KEY } from "@/hooks/useScheduleQuery"
import { absoluteUrl } from "@/lib/absolute-url"

type HistoryItem = Atendimento & {
  duracao?: string
  record?: MedicalRecord
}

function formatMs(ms: number) {
  const totalSec = Math.floor(ms / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60).toString().padStart(2, "0")
  const s = (totalSec % 60).toString().padStart(2, "0")
  return h > 0 ? `${h}:${m}:${s}` : `${m}:${s}`
}

async function fetchSchedule(): Promise<Atendimento[]> {
  try {
    const res = await fetch(absoluteUrl("/api/schedule"))
    if (!res.ok) return []
    const data = await res.json()
    return Array.isArray(data) ? data : (data?.agendamentos ?? [])
  } catch {
    return []
  }
}

export function AttendanceClient() {
  const { session, isSuperAdmin } = useAuth()
  const username = session?.user?.name ?? ""
  const role = session?.user?.role ?? ""

  const { data: allData } = useSuspenseQuery<Atendimento[]>({
    queryKey: SCHEDULE_QUERY_KEY,
    queryFn: fetchSchedule,
  })

  const active: Atendimento[] = allData.filter((item) => item.status === "Em Atendimento")
  const completed = allData.filter((item) => item.status === "Concluido")

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
      <AttendanceTable
        data={active}
        history={history}
        loadingHistory={false}
        isSuperAdmin={role === "SUPER_ADMIN"}
      />
    </div>
  )
}
