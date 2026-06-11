"use client"

import { useState, memo, useMemo } from "react"
import { useQueryClient } from "@tanstack/react-query"
import Image from "next/image"
import { toast } from "sonner"
import { Pause, Play, FileText, Download, Pencil } from "lucide-react"

import type { Appointment } from "@/types/types"
import type { MedicalRecord } from "@/types"
import type { RowType } from "@/types/rowType"
import type { ViewMode } from "@/hooks/useSchedule"

import { useTableFilters } from "@/hooks/useTableFilters"
import { useAttendanceActions } from "@/hooks/useAttendanceActions"
import { SCHEDULE_QUERY_KEY } from "@/hooks/useScheduleQuery"

import { getPatientName } from "@/lib/schedule/appointment-utils"
import { flattenAppointmentsByDay } from "@/lib/schedule/group-by-day"
import { formatDuration } from "@/lib/time/format-duration"
import { downloadMedicalRecordPdf } from "@/lib/medical-record/download-pdf"
import { AVATAR_PLACEHOLDER_URL } from "@/lib/constants"

import { MedicalRecordModal } from "@/components/medical-record/MedicalRecordModal"
import { GlobalFilters, FilterField } from "@/components/ui/table/GlobalFilters"
import { Collapse } from "@/components/ui/Collapse"
import { TableSkeleton } from "@/components/ui/TableSkeleton"
import { DataTable, TableCard, Td } from "@/components/ui/table/DataTable"
import { Button } from "@/components/ui/button"
import { ScheduleNavigator } from "@/app/(admin)/schedule/components/ScheduleNavigator"
import { TimerCell } from "./TimerCell"

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
  const { finalize, pause, resume, restart } = useAttendanceActions()

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

  const filteredHistory = history.filter((item) => {
    const patientLower = getPatientName(item).toLowerCase()
    const matchPatient = filters.patient ? patientLower.includes(filters.patient.toLowerCase()) : true
    const matchProfessional = filters.professional
      ? (item.professionalName ?? "").toLowerCase().includes(filters.professional.toLowerCase())
      : true
    const matchVisitDate = filters.visitDate ? item.date === filters.visitDate : true
    return matchPatient && matchProfessional && matchVisitDate
  })

  const historyRows: RowType[] = useMemo(
    () => flattenAppointmentsByDay(filteredHistory),
    [filteredHistory]
  )

  const historyColCount = isSuperAdmin ? 5 : 4

  function openRecordModal(item: Appointment) {
    setModalItem(item)
    setEditingRecord(item.clinicalChart ?? undefined)
  }

  function closeRecordModal() {
    setModalItem(null)
    setEditingRecord(undefined)
  }

  async function handleSaveClinicalChart(formData: Partial<MedicalRecord> & { appointmentId: number }) {
    if (!modalItem) return

    const method = editingRecord ? "PATCH" : "POST"
    const res = await fetch("/api/medical-record", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        editingRecord ? { ...formData, id: editingRecord.id } : formData
      ),
    })

    if (!res.ok) {
      toast.error("Erro ao salvar prontuário. Tente novamente.")
      return
    }

    const saved = await res.json()

    queryClient.setQueryData<Appointment[]>(SCHEDULE_QUERY_KEY, (prev) =>
      prev?.map((item) =>
        item.id === modalItem.id ? { ...item, clinicalChart: saved } : item
      ) ?? []
    )

    toast.success(editingRecord ? "Atualizado!" : "Criado!")
    closeRecordModal()
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

    await downloadMedicalRecordPdf(completeRecord)
  }

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-hidden sm:gap-6">
      <section className="flex max-h-[42dvh] shrink-0 flex-col gap-3 overflow-hidden">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
          atendimento em andamento
        </p>

        <div className="flex min-h-0 flex-col gap-3 overflow-y-auto pr-1 sm:flex-row sm:items-stretch">
          <div className="flex min-w-0 flex-1 flex-col gap-3">
            {data.length === 0 ? (
              <div className="flex min-w-0 items-center justify-center rounded-3xl border border-gray-200 bg-white p-4 text-center sm:p-5">
                <p className="text-sm leading-relaxed text-accent">Nenhum atendimento em andamento no momento...</p>
              </div>
            ) : (
              data.map((item) => {
                const hasClinicalChart = !!item.clinicalChart
                const patientName = getPatientName(item)
                return (
                  <div key={item.id} className="flex min-w-0 items-center justify-between rounded-3xl border border-gray-200 bg-white p-4 text-left sm:p-5">
                    <dl className="flex min-w-0 flex-wrap items-center gap-x-8 gap-y-2 text-sm text-gray-600">

                      <p className="min-w-0 max-w-full truncate text-lg font-semibold leading-tight text-gray-900" title={patientName}>
                        {patientName}
                      </p>
                      <div>
                        <dt className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                          Id Agendamento
                        </dt>
                        <dd className="mt-1 font-medium text-gray-800">{item.id}</dd>
                      </div>

                      <div>
                        <dt className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                          Data
                        </dt>
                        <dd className="mt-1 font-medium text-gray-800">{item.date}</dd>
                      </div>
                      <div>
                        <dt className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                          Horário
                        </dt>
                        <dd className="mt-1 font-medium text-gray-800">às {item.slotTime}</dd>
                      </div>
                      {item.professionalName && (
                        <div>
                          <dt className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                            Médico
                          </dt>
                          <dd className="mt-1 truncate font-medium text-gray-800">
                            {item.professionalName}
                          </dd>
                        </div>
                      )}
                      <div>
                        <dt className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                          Prontuário
                        </dt>
                        <dd className="mt-1 font-medium text-gray-800">
                          {hasClinicalChart ? "Preenchido" : "Pendente"}
                        </dd>
                      </div>
                    </dl>
                    <div>
                      <Image
                        src={AVATAR_PLACEHOLDER_URL}
                        alt="Avatar"
                        width={24}
                        height={24}
                        className="w-16 h-16 rounded-xl object-cover"
                      />
                    </div>
                  </div>
                )
              })
            )}

            <div className="flex flex-col justify-center gap-3 rounded-3xl border border-gray-200 bg-white p-4 sm:p-5">
              <Collapse label="Filtros" unboundedPanel>
                <GlobalFilters
                  values={filters}
                  onChange={(name, value) => handleFilterChange(name as keyof typeof filters, value)}
                  filters={FILTER_CONFIG}
                />
              </Collapse>
            </div>

            <div className="flex flex-1 flex-wrap items-center justify-between gap-3">
              <ScheduleNavigator
                date={date}
                view={view}
                onChangeDate={onChangeDate}
                onChangeView={onChangeView}
              />
            </div>
          </div>

          {data.length > 0 && (
            <div className="flex shrink-0 flex-col gap-3">
              {data.map((item) => {
                const hasClinicalChart = !!item.clinicalChart
                return (
                  <div key={item.id} className="relative flex flex-col items-center justify-between gap-2 rounded-3xl border border-gray-200 bg-white p-3 sm:h-64 sm:w-64">
                    <Button
                      size="icon"
                      className="absolute right-2.5 top-2.5 h-8 w-8 bg-white text-gray-900 hover:bg-white/90"
                      aria-label={hasClinicalChart ? "Ver prontuário" : "Criar prontuário"}
                      onClick={() => openRecordModal(item)}
                    >
                      <FileText size={14} className="shrink-0" />
                    </Button>

                    <div className="flex flex-1 items-center justify-center">
                      <TimerCell item={item} />
                    </div>

                    <div className="flex w-full flex-wrap items-center justify-center gap-2">
                      {item.pausedAt ? (
                        <>
                          <Button
                            variant="purple"
                            className="h-9 px-3 text-xs"
                            onClick={() => resume(item)}
                          >
                            <Play size={14} className="shrink-0" /> Retomar
                          </Button>
                          <Button
                            variant="secondary"
                            className="h-9 px-3 text-xs"
                            onClick={() => restart(item)}
                          >
                            Recomeçar
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="warning"
                          className="h-9 px-3 text-xs"
                          onClick={() => pause(item)}
                        >
                          <Pause size={14} className="shrink-0" /> Pausar
                        </Button>
                      )}
                      <Button
                        variant="success"
                        className="h-9 px-3 text-xs"
                        disabled={!hasClinicalChart}
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
      </section>

      <section className="flex min-h-0 flex-1 flex-col gap-3">
        <p className="shrink-0 text-xs font-semibold uppercase tracking-wide text-gray-400">Histórico de atendimentos</p>

        {loadingHistory ? (
          <TableCard>
            <div className="p-2 sm:p-3">
              <TableSkeleton cols={historyColCount} rows={4} />
            </div>
          </TableCard>
        ) : (
          <DataTable
            headers={["ID Agendamento", "Horário", "Paciente", ...(isSuperAdmin ? ["Médico"] : []), "Duração", { label: "Prontuário", align: "right" }]}
            isEmpty={filteredHistory.length === 0}
            emptyMessage="Nenhum atendimento encontrado neste período..."
          >
            {historyRows.map((row, rowIndex) => {
              if (row.type === "day") {
                return (
                  <tr key={`day-${rowIndex}-${row.label}`}>
                    <td
                      colSpan={historyColCount}
                      className="px-3 pt-4 pb-1 text-sm capitalize leading-snug text-gray-500 sm:px-4"
                    >
                      {row.label}
                    </td>
                  </tr>
                )
              }
              if (row.type !== "data") return null
              const item = row
              const patientName = getPatientName(item)
              return (
                <tr key={item.id} className="transition-colors hover:bg-gray-50/80">
                  <Td className="whitespace-nowrap">{item.id}</Td>
                  <Td className="whitespace-nowrap">{item.slotTime}h</Td>
                  <Td className="max-w-[10rem] font-medium sm:max-w-[14rem]">
                    <div className="flex items-center gap-2">
                      <Image
                        src={AVATAR_PLACEHOLDER_URL}
                        alt="Avatar"
                        width={24}
                        height={24}
                        className="w-8 h-8 rounded-[7px] object-cover"
                      />
                      <span className="line-clamp-2 break-words sm:line-clamp-none" title={patientName}>
                        {patientName}
                      </span>
                    </div>

                  </Td>
                  {isSuperAdmin && (
                    <Td className="max-w-[8rem] text-gray-600 sm:max-w-[12rem]">
                      <span className="line-clamp-2 break-words">
                        {item.professionalName}
                      </span>
                    </Td>
                  )}
                  <Td className="whitespace-nowrap font-mono text-gray-600">
                    {item.accumulatedTime ? formatDuration(item.accumulatedTime) : "—"}
                  </Td>
                  <Td>
                    {item.clinicalChart ? (
                      <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
                        <Button variant="ghost-blue" size="icon" className="text-xs sm:text-sm" onClick={() => downloadPDF(item.clinicalChart!, item)}>
                          <Download size={13} /> PDF
                        </Button>
                        <Button variant="ghost" size="icon" className="text-xs sm:text-sm" onClick={() => openRecordModal(item)}>
                          <Pencil size={13} /> Editar
                        </Button>
                      </div>
                    ) : (
                      <div className="flex justify-end">
                        <Button className="text-xs sm:text-sm" onClick={() => { setEditingRecord(undefined); setModalItem(item) }}>
                          <FileText size={12} /> Criar
                        </Button>
                      </div>
                    )}
                  </Td>
                </tr>
              )
            })}
          </DataTable>
        )}
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
          onClose={closeRecordModal}
          onSave={handleSaveClinicalChart}
        />
      )}
    </div>
  )
}

export const AttendanceTable = memo(AttendanceTableComponent)
