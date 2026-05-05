"use client"

import { useEffect, useState, useCallback, memo } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useTableFilters } from "@/hooks/useTableFilters"
import type { Atendimento } from "@/types/types"
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

function getPatientName(item: Atendimento) {
  return item.paciente?.nome ?? item.pacienteNome ?? "Sem paciente"
}

function calcElapsedMs(item: Atendimento): number {
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

function TimerCell({ item }: { item: Atendimento }) {
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
  data: Atendimento[]
  history: Atendimento[]
  loadingHistory?: boolean
  isSuperAdmin?: boolean
}

export function AttendanceTableComponent({ data, history, loadingHistory, isSuperAdmin }: Props) {
  const queryClient = useQueryClient()
  const [modalItem, setModalItem] = useState<Atendimento | null>(null)
  const [editingRecord, setEditingRecord] = useState<MedicalRecord | undefined>()

  const { filters, handleFilterChange } = useTableFilters({
    paciente: "",
    profissional: "",
    data: "",
  })

  const FILTER_CONFIG: FilterField[] = [
    { name: "paciente", type: "input", placeholder: "Paciente..." },
    ...(isSuperAdmin
      ? [{ name: "profissional", type: "input" as const, placeholder: "Médico..." }]
      : []),
    { name: "data", type: "date" as const },
  ]

  const filteredHistory = history.filter((item) => {
    const pacienteNome = getPatientName(item).toLowerCase()
    const matchPaciente = filters.paciente ? pacienteNome.includes(filters.paciente.toLowerCase()) : true
    const matchProfissional = filters.profissional
      ? (item.profissionalNome ?? "").toLowerCase().includes(filters.profissional.toLowerCase())
      : true
    const matchData = filters.data ? item.data === filters.data : true
    return matchPaciente && matchProfissional && matchData
  })

  const updateItem = useCallback(async (id: number, changes: Partial<Atendimento>) => {
    queryClient.setQueryData<Atendimento[]>(SCHEDULE_QUERY_KEY, (prev) =>
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

  const finalize = useCallback(async (item: Atendimento) => {
    if (!item.prontuario) {
      toast.error("Preencha o prontuário antes de finalizar.")
      return
    }

    const endTime = new Date().toISOString()
    const accumulatedTime = calcElapsedMs(item)

    queryClient.setQueryData<Atendimento[]>(SCHEDULE_QUERY_KEY, (prev) =>
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

  const pause = useCallback((item: Atendimento) => {
    updateItem(item.id, { pausedAt: new Date().toISOString(), accumulatedTime: calcElapsedMs(item) })
  }, [updateItem])

  const resume = useCallback((item: Atendimento) => {
    updateItem(item.id, { pausedAt: null as any, startTime: new Date().toISOString() })
  }, [updateItem])

  const restart = useCallback((item: Atendimento) => {
    updateItem(item.id, { pausedAt: null as any, startTime: new Date().toISOString(), accumulatedTime: 0 })
  }, [updateItem])

  async function handleSaveProntuario(formData: Partial<MedicalRecord> & { atendimentoId: number }) {
    if (!modalItem) return

    const method = editingRecord ? "PATCH" : "POST"
    const res = await fetch("/api/medical-record", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        editingRecord
          ? { ...formData, id: editingRecord.id }
          : { ...formData, agendamentoId: formData.atendimentoId }
      ),
    })

    const saved = await res.json()

    queryClient.setQueryData<Atendimento[]>(SCHEDULE_QUERY_KEY, (prev) =>
      prev?.map((item) =>
        item.id === modalItem.id ? { ...item, prontuario: saved } : item
      ) ?? []
    )

    toast.success(editingRecord ? "Atualizado!" : "Criado!")
    setModalItem(null)
    setEditingRecord(undefined)
  }

  async function downloadPDF(record: MedicalRecord, item?: Atendimento) {
    const completeRecord: MedicalRecord = {
      ...record,
      agendamento: record.agendamento || (item ? {
        data: item.data,
        horario: item.horario,
        profissionalNome: item.profissionalNome,
      } : undefined),
      paciente: record.paciente || item?.paciente,
    }

    const blob = await pdf(<MedicalRecordPDF data={completeRecord} />).toBlob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    const patientName = (completeRecord.paciente?.nome ?? "paciente").replace(/\s+/g, "-").toLowerCase()
    a.download = `prontuario-${patientName}.pdf`
    a.click()
    URL.revokeObjectURL(url)
    toast.success("PDF gerado!")
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-auto sm:gap-8">

      <div className="flex flex-col gap-3">
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
              const hasProntuario = !!item.prontuario
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
                      <span>{item.data}</span>
                      <span className="text-gray-300" aria-hidden>
                        ·
                      </span>
                      <span>às {item.horario}</span>
                      <TimerCell item={item} />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 sm:shrink-0 sm:justify-end">
                    <Button
                      className="text-xs sm:text-sm"
                      onClick={() => {
                        setModalItem(item)
                        setEditingRecord(item.prontuario ?? undefined)
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
                      disabled={!item.prontuario}
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
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Histórico de atendimentos</p>
        <Collapse label="Filtros">
          <GlobalFilters
            values={filters}
            onChange={(name, value) => handleFilterChange(name as keyof typeof filters, value)}
            filters={FILTER_CONFIG}
          />
        </Collapse>
        {loadingHistory ? (
          <TableSkeleton cols={6} rows={4} />
        ) : filteredHistory.length === 0 ? (
          <table className="min-w-[min(100%,36rem)] w-full border-separate border-spacing-y-2 sm:min-w-[600px]">
            <thead>
              <tr>
                {["Data", "Horário", "Paciente", ...(isSuperAdmin ? ["Médico"] : []), "Duração", "Prontuário"].map((h) => (
                  <th key={h} className="px-2 py-2 text-left text-[11px] font-medium uppercase tracking-wide text-gray-500 sm:px-3 sm:text-xs sm:normal-case sm:tracking-normal">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td
                  colSpan={isSuperAdmin ? 6 : 5}
                  className="px-3 py-8 text-center text-sm leading-relaxed text-gray-400"
                >
                  Nenhum atendimento concluído
                </td>
              </tr>
            </tbody>
          </table>

        ) : (
          <div className="-mx-1 overflow-x-auto px-1 sm:mx-0 sm:px-0">
            <table className="min-w-[min(100%,36rem)] w-full border-separate border-spacing-y-2 sm:min-w-[600px]">
              <thead>
                <tr>
                  {["Data", "Horário", "Paciente", ...(isSuperAdmin ? ["Médico"] : []), "Duração", "Prontuário"].map((h) => (
                    <th key={h} className="px-2 py-2 text-left text-[11px] font-medium uppercase tracking-wide text-gray-500 sm:px-3 sm:text-xs sm:normal-case sm:tracking-normal">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredHistory.map((item) => {
                  const pn = getPatientName(item)
                  return (
                    <tr key={item.id} className="bg-white shadow-sm">
                      <td className="whitespace-nowrap p-2 text-xs text-gray-600 sm:p-3 sm:text-sm">{item.data}</td>
                      <td className="whitespace-nowrap p-2 text-xs sm:p-3 sm:text-sm">{item.horario}</td>
                      <td className="max-w-[10rem] p-2 text-xs font-medium sm:max-w-[14rem] sm:p-3 sm:text-sm">
                        <span className="line-clamp-2 break-words sm:line-clamp-none" title={pn}>
                          {pn}
                        </span>
                      </td>
                      {isSuperAdmin && (
                        <td className="max-w-[8rem] p-2 text-xs text-gray-600 sm:max-w-[12rem] sm:p-3 sm:text-sm">
                          <span className="line-clamp-2 break-words" title={item.profissionalNome ?? ""}>
                            {item.profissionalNome ?? "—"}
                          </span>
                        </td>
                      )}
                      <td className="whitespace-nowrap p-2 font-mono text-xs text-gray-600 sm:p-3 sm:text-sm">
                        {item.accumulatedTime ? formatMs(item.accumulatedTime) : "—"}
                      </td>
                      <td className="p-2 sm:p-3">
                        {item.prontuario ? (
                          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                            <Button variant="ghost-blue" size="icon" className="text-xs sm:text-sm" onClick={() => downloadPDF(item.prontuario!, item)}>
                              <Download size={13} /> PDF
                            </Button>
                            <Button variant="ghost" size="icon" className="text-xs sm:text-sm" onClick={() => { setModalItem(item); setEditingRecord(item.prontuario ?? undefined) }}>
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
          </div>
        )}
      </div>

      {modalItem && (
        <MedicalRecordModal
          atendimento={{
            id: modalItem.id,
            data: modalItem.data,
            pacienteNome: getPatientName(modalItem),
            profissionalNome: modalItem.profissionalNome,
            horario: modalItem.horario,
          }}
          data={editingRecord}
          onClose={() => { setModalItem(null); setEditingRecord(undefined) }}
          onSave={handleSaveProntuario}
        />
      )}
    </div>
  )
}

export const AttendanceTable = memo(AttendanceTableComponent)
