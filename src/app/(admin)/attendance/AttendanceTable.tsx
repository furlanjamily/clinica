"use client"

import { useState, memo, useMemo } from "react"
import { toast } from "sonner"
import { Pause, Play, FileText, Download, Pencil } from "lucide-react"

import type { Appointment } from "@/types/types"
import type { MedicalRecord } from "@/types"
import type { RowType } from "@/types/rowType"
import type { ViewMode } from "@/hooks/useSchedule"

import { useTableFilters } from "@/hooks/useTableFilters"
import { useAttendanceActions } from "@/hooks/useAttendanceActions"
import { useMedicalRecordMutations } from "@/hooks/useMedicalRecord"

import { getPatientName } from "@/lib/schedule/appointment-utils"
import { flattenAppointmentsByDay } from "@/lib/schedule/group-by-day"
import { formatDuration } from "@/lib/time/format-duration"
import { downloadMedicalRecordPdf } from "@/lib/medical-record/download-pdf"

import { Avatar } from "@/components/common/Avatar"

import { MedicalRecordModal } from "@/components/medical-record/MedicalRecordModal"
import { GlobalFilters, FilterField } from "@/components/ui/table/GlobalFilters"
import { Collapse } from "@/components/ui/Collapse"
import { TableSkeleton } from "@/components/ui/TableSkeleton"
import { DataTable, TableCard, Td } from "@/components/ui/table/DataTable"
import { PAGE_SIZE_OPTIONS } from "@/components/ui/table/TablePagination"
import { Button } from "@/components/ui/button"
import { ScheduleNavigator } from "@/app/(admin)/schedule/components/ScheduleNavigator"
import { TimerCell } from "./TimerCell"
import {
  attendanceMobileRootClass,
  attendanceTopSectionClass,
  attendanceHistorySectionClass,
  attendanceFilterTableClass,
  attendanceHistoryPanelClass,
  filterTableFiltersClass,
} from "@/lib/layout/filter-table-layout"
import { cn } from "@/lib/utils"

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
  const { finalize, pause, resume, restart } = useAttendanceActions()
  const { saveRecord } = useMedicalRecordMutations()

  const [modalItem, setModalItem] = useState<Appointment | null>(null)
  const [editingRecord, setEditingRecord] = useState<MedicalRecord | undefined>()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZE_OPTIONS[0])

  const { filters, handleFilterChange } = useTableFilters({
    id: "",
    visitDate: "",
    patient: "",
    professional: "",
  })

  const FILTER_CONFIG: FilterField[] = [
    { name: "id", type: "input", placeholder: "ID..." },
    { name: "visitDate", type: "date" as const },
    { name: "patient", type: "input", placeholder: "Paciente..." },
    ...(isSuperAdmin
      ? [{ name: "professional", type: "input" as const, placeholder: "Médico..." }]
      : []),
  ]

  const filteredHistory = history.filter((item) => {
    const matchId = filters.id ? item.id.toString() === filters.id : true
    const patientLower = getPatientName(item).toLowerCase()
    const matchPatient = filters.patient ? patientLower.includes(filters.patient.toLowerCase()) : true
    const matchProfessional = filters.professional
      ? (item.professionalName ?? "").toLowerCase().includes(filters.professional.toLowerCase())
      : true
    const matchVisitDate = filters.visitDate ? item.date === filters.visitDate : true
    return matchPatient && matchProfessional && matchVisitDate && matchId
  })

  const historyTotal = filteredHistory.length
  const historySafePage = Math.min(page, Math.max(1, Math.ceil(historyTotal / pageSize)))

  const pageHistory = useMemo(
    () => filteredHistory.slice((historySafePage - 1) * pageSize, historySafePage * pageSize),
    [filteredHistory, historySafePage, pageSize]
  )

  const historyRows: RowType[] = useMemo(
    () => flattenAppointmentsByDay(pageHistory),
    [pageHistory]
  )

  const historyColCount = isSuperAdmin ? 6 : 5

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

    const saved = await saveRecord(formData, {
      editingId: editingRecord?.id,
      syncSchedule: true,
    })

    if (!saved) return

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
    <div className={attendanceMobileRootClass}>
      <section className={attendanceTopSectionClass}>
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
          atendimento em andamento
        </p>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:grid-rows-[auto_1fr]">
          <div className="min-w-0 lg:col-start-1 lg:row-start-1">
            {data.length === 0 ? (
              <div className="flex min-w-0 items-center justify-center rounded-3xl border border-gray-200 bg-white p-4 text-center sm:p-5">
                <p className="text-sm leading-relaxed text-accent">Nenhum atendimento em andamento no momento...</p>
              </div>
            ) : (
              data.map((item) => {
                const hasClinicalChart = !!item.clinicalChart
                const patientName = getPatientName(item)
                return (
                  <div
                    key={item.id}
                    className="flex min-w-0 items-center gap-3 rounded-3xl border border-gray-200 bg-white p-4 sm:p-5"
                  >
                    <div className="min-w-0 flex-1 overflow-x-auto overscroll-x-contain [scrollbar-width:thin]">
                      <dl className="flex w-max min-w-full flex-nowrap items-center gap-x-6 text-sm text-gray-600 sm:gap-x-8">
                        <p
                          className="whitespace-nowrap text-lg font-semibold leading-tight text-gray-900"
                          title={patientName}
                        >
                          {patientName}
                        </p>
                        <div className="shrink-0">
                          <dt className="whitespace-nowrap text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                            Id Agendamento
                          </dt>
                          <dd className="mt-1 whitespace-nowrap font-medium text-gray-800">{item.id}</dd>
                        </div>
                        <div className="shrink-0">
                          <dt className="whitespace-nowrap text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                            Data
                          </dt>
                          <dd className="mt-1 whitespace-nowrap font-medium text-gray-800">{item.date}</dd>
                        </div>
                        <div className="shrink-0">
                          <dt className="whitespace-nowrap text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                            Horário
                          </dt>
                          <dd className="mt-1 whitespace-nowrap font-medium text-gray-800">às {item.slotTime}</dd>
                        </div>
                        {item.professionalName && (
                          <div className="shrink-0">
                            <dt className="whitespace-nowrap text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                              Médico
                            </dt>
                            <dd className="mt-1 whitespace-nowrap font-medium text-gray-800">
                              {item.professionalName}
                            </dd>
                          </div>
                        )}
                        <div className="shrink-0">
                          <dt className="whitespace-nowrap text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                            Prontuário
                          </dt>
                          <dd className="mt-1 whitespace-nowrap font-medium text-gray-800">
                            {hasClinicalChart ? "Preenchido" : "Pendente"}
                          </dd>
                        </div>
                      </dl>
                    </div>
                    <div className="shrink-0">
                      <Avatar
                        name={patientName}
                        image={item.patient?.image}
                        size={64}
                        className="rounded-xl"
                        alt={`Foto de ${patientName}`}
                      />
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {data.length > 0 && (
            <div className="flex w-full flex-col gap-3 lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:w-auto lg:shrink-0">
              {data.map((item) => {
                const hasClinicalChart = !!item.clinicalChart
                return (
                  <div
                    key={item.id}
                    className="relative flex w-full flex-col items-center justify-between gap-2 rounded-3xl border border-gray-200 bg-white p-3 lg:h-64 lg:w-64"
                  >
                    <Button
                      size="icon"
                      className="absolute right-2.5 top-2.5 h-8 w-8 bg-white text-gray-900 hover:bg-white/90"
                      aria-label={hasClinicalChart ? "Ver prontuário" : "Criar prontuário"}
                      onClick={() => openRecordModal(item)}
                    >
                      <FileText size={14} className="shrink-0" />
                    </Button>

                    <div className="flex flex-1 items-center justify-center py-2 lg:py-0">
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

          <div className="flex w-full min-w-0 justify-center lg:col-start-1 lg:row-start-2 lg:min-h-0 lg:items-center lg:justify-start lg:self-stretch lg:px-3">
            <ScheduleNavigator
              date={date}
              view={view}
              onChangeDate={onChangeDate}
              onChangeView={onChangeView}
              className="max-lg:items-center max-lg:justify-center max-lg:[&>div:first-child]:justify-center"
            />
          </div>
        </div>
      </section>

      <section className={attendanceHistorySectionClass}>
        <p className="shrink-0 text-xs font-semibold uppercase tracking-wide text-gray-400">Histórico de atendimentos</p>

        <div className={attendanceFilterTableClass}>
          <div
            className={cn(
              "flex shrink-0 flex-col justify-center gap-3 rounded-3xl border border-gray-200 bg-white p-4 sm:p-5",
              filterTableFiltersClass
            )}
          >
            <Collapse label="Filtros" unboundedPanel>
              <GlobalFilters
                values={filters}
                onChange={(name, value) => handleFilterChange(name as keyof typeof filters, value)}
                filters={FILTER_CONFIG}
              />
            </Collapse>
          </div>

          <div className={attendanceHistoryPanelClass}>
            {loadingHistory ? (
              <TableCard className="h-full min-h-0">
                <div className="p-2 sm:p-3">
                  <TableSkeleton cols={historyColCount} rows={4} />
                </div>
              </TableCard>
            ) : (
              <DataTable
                className="h-full min-h-0"
              headers={["ID Agendamento", "Horário", "Paciente", ...(isSuperAdmin ? ["Médico"] : []), "Duração", { label: "Prontuário", align: "right" }]}
              isEmpty={filteredHistory.length === 0}
              emptyMessage="Nenhum atendimento encontrado neste período..."
              pagination={
                historyTotal > 0
                  ? {
                    page: historySafePage,
                    pageSize,
                    total: historyTotal,
                    onPageChange: setPage,
                    onPageSizeChange: (size) => {
                      setPageSize(size)
                      setPage(1)
                    },
                  }
                  : undefined
              }
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
                    <Td className="line-clamp-2 break-words sm:line-clamp-none">{patientName}</Td>

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
          onClose={closeRecordModal}
          onSave={handleSaveClinicalChart}
        />
      )}
    </div>
  )
}

export const AttendanceTable = memo(AttendanceTableComponent)
