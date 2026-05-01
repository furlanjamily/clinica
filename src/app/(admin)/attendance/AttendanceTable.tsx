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
import { pdf } from "@react-pdf/renderer"
import { MedicalRecordPDF } from "@/components/MedicalRecordPDF"
import { TableSkeleton } from "@/components/ui/TableSkeleton"
import { Button } from "@/components/ui/button"
import { SCHEDULE_QUERY_KEY } from "@/hooks/useScheduleQuery"

function getPatientName(item: Atendimento) {
  return item.paciente?.nome ?? "Sem paciente"
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

  // Atualiza otimisticamente o cache do React Query e persiste no servidor
  const updateItem = useCallback(async (id: number, changes: Partial<Atendimento>) => {
    // Atualização otimista: reflete imediatamente na UI
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

    // Atualização otimista
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
      // Reverte em caso de erro
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

    // Atualiza o prontuário no cache
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
    <div className="flex flex-col gap-8 flex-1 min-h-0 overflow-auto">

      {/* EM ANDAMENTO */}
      <div className="flex flex-col gap-3">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Em andamento</p>
        {data.length === 0 ? (
          <p className="text-sm text-accent">Nenhum atendimento em andamento no momento.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {data.map((item) => {
              const hasProntuario = !!item.prontuario
              return (
                <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm flex justify-between">
                  <div>
                    <p className="font-semibold">{getPatientName(item)}</p>
                    <p className="text-xs text-gray-500">
                      {item.profissionalNome} · {item.horario}
                    </p>
                    <TimerCell item={item} />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => { setModalItem(item); setEditingRecord(item.prontuario ?? undefined) }}>
                      <FileText size={12} />
                      {hasProntuario ? "Ver" : "Criar"}
                    </Button>
                    {item.pausedAt ? (
                      <>
                        <Button variant="purple" onClick={() => resume(item)}>
                          <Play size={12} /> Retomar
                        </Button>
                        <Button variant="secondary" onClick={() => restart(item)}>
                          Recomeçar
                        </Button>
                      </>
                    ) : (
                      <Button variant="warning" onClick={() => pause(item)}>
                        <Pause size={12} /> Pausar
                      </Button>
                    )}
                    <Button
                      variant="success"
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

      {/* HISTÓRICO */}
      <div className="flex flex-col gap-3 flex-1 min-h-0">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Histórico de atendimentos</p>
        <GlobalFilters
          values={filters}
          onChange={(name, value) => handleFilterChange(name as keyof typeof filters, value)}
          filters={FILTER_CONFIG}
        />
        {loadingHistory ? (
          <TableSkeleton cols={6} rows={4} />
        ) : filteredHistory.length === 0 ? (
          <div className="flex items-center justify-center flex-1 text-accent text-sm">
            Nenhum atendimento concluído
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-separate border-spacing-y-2 min-w-[600px]">
              <thead>
                <tr>
                  {["Data", "Horário", "Paciente", ...(isSuperAdmin ? ["Médico"] : []), "Duração", "Prontuário"].map((h) => (
                    <th key={h} className="text-left text-xs px-3 text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredHistory.map((item) => (
                  <tr key={item.id} className="bg-white shadow-sm">
                    <td className="p-3 text-sm text-gray-600">{item.data}</td>
                    <td className="p-3 text-sm">{item.horario}</td>
                    <td className="p-3 text-sm font-medium">{item.paciente.nome}</td>
                    {isSuperAdmin && <td className="p-3 text-sm text-gray-600">{item.profissionalNome}</td>}
                    <td className="p-3 text-sm font-mono text-gray-600">
                      {item.accumulatedTime ? formatMs(item.accumulatedTime) : "—"}
                    </td>
                    <td className="p-3">
                      {item.prontuario ? (
                        <div className="flex items-center gap-3">
                          <Button variant="ghost-blue" size="icon" onClick={() => downloadPDF(item.prontuario!, item)}>
                            <Download size={13} /> PDF
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => { setModalItem(item); setEditingRecord(item.prontuario ?? undefined) }}>
                            <Pencil size={13} /> Editar
                          </Button>
                        </div>
                      ) : (
                        <Button onClick={() => { setEditingRecord(undefined); setModalItem(item) }}>
                          <FileText size={12} /> Criar
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalItem && (
        <MedicalRecordModal
          atendimento={{
            id: modalItem.id,
            pacienteNome: modalItem.paciente.nome,
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
