"use client"

import { useEffect, useState, useCallback, memo, useMemo } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useTableFilters } from "@/hooks/useTableFilters"
import type { Appointment } from "@/types/types"
import { Pause, Play, FileText, Download, Pencil } from "lucide-react"
import { MedicalRecordModal } from "@/components/medical-record/MedicalRecordModal"
import type { MedicalRecord } from "@/types"
import { toast } from "sonner"
import { GlobalFilters, FilterField } from "@/components/ui/table/GlobalFilters"
import { Collapse } from "@/components/ui/Collapse"
import { pdf } from "@react-pdf/renderer"
import { MedicalRecordPDF } from "@/components/MedicalRecordPDF"
import { TableSkeleton } from "@/components/ui/TableSkeleton"
import { Button } from "@/components/ui/button"
import { SCHEDULE_QUERY_KEY } from "@/hooks/useScheduleQuery"
import type { ViewMode } from "@/hooks/useSchedule"
import { ScheduleNavigator } from "@/app/(admin)/schedule/components/ScheduleNavigator"
import type { RowType } from "@/types/rowType"

function getPatientName(item: Appointment) {
  return item.patient?.name ?? item.patientName ?? "Sem paciente"
}

function calcElapsedMs(item: Appointment): number {
  const accumulated = item.accumulatedTime ?? 0
  if (item.pausedAt) return accumulated
  if (!item.startTime) return accumulated
  return accumulated + (Date.now() - new Date(item.startTime).getTime())
}

function formatMs(ms: number) {
  const totalSec = Math.floor(ms / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60).toString().padStart(2, "0")
  const s = (totalSec % 60).toString().padStart(2, "0")
  return h > 0 ? `${h}:${m}:${s}` : `${m}:${s}`
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

function flattenHistoryByDay(items: Appointment[]): RowType[] {
  const grouped = items.reduce<Record<string, Record<string, Appointment[]>>>(
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

  const flattened: RowType[] = []

  sortedMonths.forEach(([_month, days]) => {
    const sortedDays = Object.entries(days).sort((a, b) => {
      const dateA = new Date(a[1][0].date)
      const dateB = new Date(b[1][0].date)
      return dateA.getTime() - dateB.getTime()
    })

    sortedDays.forEach(([day, rows]) => {
      flattened.push({ type: "day", label: day })
      const orderedRows = [...rows].sort(sortByTime)
      orderedRows.forEach((row) => {
        flattened.push({ ...row, type: "data" })
      })
    })
  })

  return flattened
}

function TimerCell({ item }: { item: Appointment }) {
  const [mounted, setMounted] = useState(false)
  const [, setTick] = useState(0)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (item.pausedAt) return
    const interval = setInterval(() => setTick((t) => t + 1), 1000)
    return () => clearInterval(interval)
  }, [item.pausedAt, item.startTime])

  if (!mounted) return <span className="text-gray-400 text-sm">--:--</span>

  return (
    <span className="font-mono text-purple-600 text-sm">
      {formatMs(calcElapsedMs(item))}
    </span>
  )
}

type Props = {
  data: Appointment[]
  history: Appointment[]
  loadingHistory?: boolean
  isSuperAdmin?: boolean
  date: Date
  view: ViewMode
  onChangeDate: (date: Date) => void
  onChangeView: (view: ViewMode) => void
}

export function AttendanceTableComponent({
  data,
  history,
  loadingHistory,
  isSuperAdmin,
  date,
  view,
  onChangeDate,
  onChangeView,
}: Props) {
  const queryClient = useQueryClient()
  const [modalItem, setModalItem] = useState<Appointment | null>(null)
  const [editingRecord, setEditingRecord] = useState<MedicalRecord | undefined>()

  const { filters, handleFilterChange } = useTableFilters({
    patient: "",
    professional: "",
    visitDate: "",
  })

  const FILTER_CONFIG: FilterField[] = [
    { name: "patient", type: "input", placeholder: "Paciente..." },
    ...(isSuperAdmin
      ? [{ name: "professional", type: "input" as const, placeholder: "Médico..." }]
      : []),
    { name: "visitDate", type: "date" as const },
  ]

  const setScheduleDataFromQuery: React.Dispatch<React.SetStateAction<Appointment[]>> = useCallback(
    (updater) => {
      queryClient.setQueryData<Appointment[]>(SCHEDULE_QUERY_KEY, (prev) => {
        const list = prev ?? []
        return typeof updater === "function" ? (updater as (p: Appointment[]) => Appointment[])(list) : updater
      })
    },
    [queryClient]
  )

  const filteredHistory = history.filter((item) => {
    const patientLower = getPatientName(item).toLowerCase()
    const matchPatient = filters.patient ? patientLower.includes(filters.patient.toLowerCase()) : true
    const matchProfessional = filters.professional
      ? (item.professionalName ?? "").toLowerCase().includes(filters.professional.toLowerCase())
      : true
    const matchVisitDate = filters.visitDate ? item.date === filters.visitDate : true
    return matchPatient && matchProfessional && matchVisitDate
  })

  const historyRows = useMemo(() => flattenHistoryByDay(filteredHistory), [filteredHistory])

  const historyColCount = isSuperAdmin ? 5 : 4

  const updateItem = useCallback(async (id: number, changes: Partial<Appointment>) => {
    queryClient.setQueryData<Appointment[]>(SCHEDULE_QUERY_KEY, (prev) =>
      prev?.map((item) =>
        item.id === id
          ? {
            ...item,
            ...changes,
            pausedAt: changes.pausedAt === null ? undefined : changes.pausedAt ?? item.pausedAt,
          }
          : item
      ) ?? []
    )

    await fetch("/api/schedule", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...changes }),
    })
  }, [queryClient])

  const finalize = useCallback(async (item: Appointment) => {
    if (!item.clinicalChart) {
      toast.error("Preencha o prontuário antes de finalizar.")
      return
    }

    const endTime = new Date().toISOString()
    const accumulatedTime = calcElapsedMs(item)

    queryClient.setQueryData<Appointment[]>(SCHEDULE_QUERY_KEY, (prev) =>
      prev?.map((i) =>
        i.id === item.id ? { ...i, status: "Concluido", endTime, accumulatedTime } : i
      ) ?? []
    )

    try {
      const res = await fetch("/api/schedule", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, status: "Concluido", endTime, accumulatedTime }),
      })

      if (!res.ok) throw new Error("Erro ao finalizar atendimento")

      toast.success("Atendimento finalizado!")
    } catch (error) {
      console.error(error)
      toast.error("Erro ao finalizar atendimento. Tente novamente.")
      queryClient.invalidateQueries({ queryKey: SCHEDULE_QUERY_KEY })
    }
  }, [queryClient])

  const pause = useCallback((item: Appointment) => {
    updateItem(item.id, { pausedAt: new Date().toISOString(), accumulatedTime: calcElapsedMs(item) })
  }, [updateItem])

  const resume = useCallback((item: Appointment) => {
    updateItem(item.id, { pausedAt: null as any, startTime: new Date().toISOString() })
  }, [updateItem])

  const restart = useCallback((item: Appointment) => {
    updateItem(item.id, { pausedAt: null as any, startTime: new Date().toISOString(), accumulatedTime: 0 })
  }, [updateItem])

  async function handleSaveClinicalChart(formData: Partial<MedicalRecord> & { appointmentId: number }) {
    if (!modalItem) return

    const method = editingRecord ? "PATCH" : "POST"
    const res = await fetch("/api/medical-record", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        editingRecord
          ? { ...formData, id: editingRecord.id }
          : formData
      ),
    })

    const saved = await res.json()

    queryClient.setQueryData<Appointment[]>(SCHEDULE_QUERY_KEY, (prev) =>
      prev?.map((item) =>
        item.id === modalItem.id ? { ...item, clinicalChart: saved } : item
      ) ?? []
    )

    toast.success(editingRecord ? "Atualizado!" : "Criado!")
    setModalItem(null)
    setEditingRecord(undefined)
  }

  async function downloadPDF(record: MedicalRecord, item?: Appointment) {
    const completeRecord: MedicalRecord = {
      ...record,
      appointment: record.appointment || (item ? {
        date: item.date,
        slotTime: item.slotTime,
        professionalName: item.professionalName,
      } : undefined),
      patientDetails: record.patientDetails || item?.patient,
    }

    const blob = await pdf(<MedicalRecordPDF data={completeRecord} />).toBlob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    const patientName = (completeRecord.patientDetails?.name ?? "paciente").replace(/\s+/g, "-").toLowerCase()
    a.download = `prontuario-${patientName}.pdf`
    a.click()
    URL.revokeObjectURL(url)
    toast.success("PDF gerado!")
  }

  return (
    <div className="flex min-w-0 flex-col gap-4 sm:gap-6">
      <section className="flex shrink-0 flex-col gap-3">
        {data.length === 0 ? (
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Em andamento</p>
        ) : (
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            {data.length === 1
              ? "1 atendimento em andamento"
              : `${data.length} atendimentos em andamento`}
          </p>
        )}

        {data.length === 0 ? (
          <p className="text-sm leading-relaxed text-accent">Nenhum atendimento em andamento no momento.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {data.map((item) => {
              const hasProntuario = !!item.clinicalChart
              const nome = getPatientName(item)
              return (
                <div
                  key={item.id}
                  className="flex flex-col gap-4 rounded-xl border border-gray-100 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:p-4"
                >
                  <div className="min-w-0 flex-1 text-left">
                    <p className="truncate font-semibold text-gray-900" title={nome}>
                      {nome}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500">
                      <span>{item.date}</span>
                      <span className="text-gray-300" aria-hidden>
                        ·
                      </span>
                      <span>às {item.slotTime}</span>
                      <TimerCell item={item} />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 sm:shrink-0 sm:justify-end">
                    <Button
                      className="text-xs sm:text-sm"
                      onClick={() => {
                        setModalItem(item)
                        setEditingRecord(item.clinicalChart ?? undefined)
                      }}
                    >
                      <FileText size={12} className="shrink-0" />
                      {hasProntuario ? "Ver" : "Criar"}
                    </Button>
                    {item.pausedAt ? (
                      <>
                        <Button variant="purple" className="text-xs sm:text-sm" onClick={() => resume(item)}>
                          <Play size={12} className="shrink-0" /> Retomar
                        </Button>
                        <Button variant="secondary" className="text-xs sm:text-sm" onClick={() => restart(item)}>
                          Recomeçar
                        </Button>
                      </>
                    ) : (
                      <Button variant="warning" className="text-xs sm:text-sm" onClick={() => pause(item)}>
                        <Pause size={12} className="shrink-0" /> Pausar
                      </Button>
                    )}
                    <Button
                      variant="success"
                      className="text-xs sm:text-sm"
                      disabled={!item.clinicalChart}
                      onClick={() => finalize(item)}
                    >
                      Finalizar
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex shrink-0 flex-col gap-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Histórico de atendimentos</p>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <ScheduleNavigator
              date={date}
              view={view}
              onChangeDate={onChangeDate}
              onChangeView={onChangeView}
            />
          </div>
          <Collapse label="Filtros" unboundedPanel>
            <GlobalFilters
              values={filters}
              onChange={(name, value) => handleFilterChange(name as keyof typeof filters, value)}
              filters={FILTER_CONFIG}
            />
          </Collapse>
        </div>

        <div className="min-w-0 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
          <div className="max-h-[min(58dvh,calc(100dvh-13rem))] overflow-y-auto overflow-x-auto overscroll-contain [-webkit-overflow-scrolling:touch] scroll-pb-4 pb-4 sm:max-h-[min(70vh,36rem)] sm:pb-3">
            {loadingHistory ? (
              <div className="p-2 sm:p-3">
                <TableSkeleton cols={historyColCount} rows={4} />
              </div>
            ) : filteredHistory.length === 0 ? (
              <table className="w-full min-w-[min(100%,36rem)] border-separate border-spacing-y-2 sm:min-w-[600px]">
                <thead className="bg-white">
                  <tr>
                    {["Horário", "Paciente", ...(isSuperAdmin ? ["Médico"] : []), "Duração", "Prontuário"].map((h) => (
                      <th key={h} className="px-2 py-2 text-left text-[11px] font-medium uppercase tracking-wide text-gray-500 sm:px-3 sm:text-xs sm:normal-case sm:tracking-normal">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td
                      colSpan={historyColCount}
                      className="px-3 py-8 text-center text-sm leading-relaxed text-gray-400"
                    >
                      Nenhum atendimento concluído
                    </td>
                  </tr>
                </tbody>
              </table>

            ) : (
              <table className="w-full min-w-[min(100%,36rem)] border-separate border-spacing-y-2 sm:min-w-[600px]">
                <thead className="border-b border-gray-200 bg-white">
                  <tr>
                    {["Horário", "Paciente", ...(isSuperAdmin ? ["Médico"] : []), "Duração", "Prontuário"].map((h) => (
                      <th key={h} className="px-2 py-2 text-left text-[11px] font-medium uppercase tracking-wide text-gray-500 sm:px-3 sm:text-xs sm:normal-case sm:tracking-normal">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {historyRows.map((row, rowIndex) => {
                    if (row.type === "day") {
                      return (
                        <tr key={`day-${rowIndex}-${row.label}`}>
                          <td
                            colSpan={historyColCount}
                            className="pt-3 text-sm capitalize leading-snug text-gray-500"
                          >
                            {row.label}
                          </td>
                        </tr>
                      )
                    }
                    if (row.type !== "data") return null
                    const item = row
                    const pn = getPatientName(item)
                    return (
                      <tr key={item.id} className="bg-white shadow-sm">
                        <td className="whitespace-nowrap p-2 text-xs sm:p-3 sm:text-sm">{item.slotTime}</td>
                        <td className="max-w-[10rem] p-2 text-xs font-medium sm:max-w-[14rem] sm:p-3 sm:text-sm">
                          <span className="line-clamp-2 break-words sm:line-clamp-none" title={pn}>
                            {pn}
                          </span>
                        </td>
                        {isSuperAdmin && (
                          <td className="max-w-[8rem] p-2 text-xs text-gray-600 sm:max-w-[12rem] sm:p-3 sm:text-sm">
                            <span className="line-clamp-2 break-words">
                              {item.professionalName}
                            </span>
                          </td>
                        )}
                        <td className="whitespace-nowrap p-2 font-mono text-xs text-gray-600 sm:p-3 sm:text-sm">
                          {item.accumulatedTime ? formatMs(item.accumulatedTime) : "—"}
                        </td>
                        <td className="p-2 sm:p-3">
                          {item.clinicalChart ? (
                            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                              <Button variant="ghost-blue" size="icon" className="text-xs sm:text-sm" onClick={() => downloadPDF(item.clinicalChart!, item)}>
                                <Download size={13} /> PDF
                              </Button>
                              <Button variant="ghost" size="icon" className="text-xs sm:text-sm" onClick={() => { setModalItem(item); setEditingRecord(item.clinicalChart ?? undefined) }}>
                                <Pencil size={13} /> Editar
                              </Button>
                            </div>
                          ) : (
                            <Button className="text-xs sm:text-sm" onClick={() => { setEditingRecord(undefined); setModalItem(item) }}>
                              <FileText size={12} /> Criar
                            </Button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </section>

      {modalItem && (
        <MedicalRecordModal
          visit={{
            id: modalItem.id,
            date: modalItem.date,
            patientName: getPatientName(modalItem),
            professionalName: modalItem.professionalName,
            slotTime: modalItem.slotTime,
          }}
          data={editingRecord}
          onClose={() => { setModalItem(null); setEditingRecord(undefined) }}
          onSave={handleSaveClinicalChart}
        />
      )}
    </div>
  )
}

export const AttendanceTable = memo(AttendanceTableComponent)
