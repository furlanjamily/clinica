"use client"

import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { Calendar } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import type { Appointment } from "@/types/types"
import { RowType } from "@/types/rowType"
import { ScheduleFormModal } from "@/components/schedule/ScheduleFormModal"
import { PaymentConfirmModal } from "@/components/schedule/PaymentConfirmModal"
import { Button } from "@/components/ui/button"
import { TableCard, Td } from "@/components/ui/table/DataTable"
import { useQueryClient } from "@tanstack/react-query"
import { SCHEDULE_QUERY_KEY } from "@/hooks/useScheduleQuery"
import { AppointmentStatus, STATUS_LABEL, STATUS_STYLE } from "@/lib/schedule/status"

function isDataRow(row: RowType): row is { type: "data" } & Appointment {
  return row.type === "data"
}

function isToday(dateStr: string) {
  const [year, month, day] = dateStr.split("-").map(Number)
  const date = new Date(year, month - 1, day)
  const today = new Date()
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  )
}

type TableProps = {
  rows: RowType[]
  setData: React.Dispatch<React.SetStateAction<Appointment[]>>
}

const COLUMN_COUNT = 5

const columnHelper = createColumnHelper<RowType>()

function ActionCell({ original, updateItem, onReschedule, onOpenPayment }: {
  original: Appointment
  updateItem: (id: number, changes: Partial<Appointment>) => Promise<void>
  onReschedule: (item: Appointment) => void
  onOpenPayment: (item: Appointment) => void
}) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const today = isToday(original.date)
  const [loading, setLoading] = useState(false)

  if (today && original.status === AppointmentStatus.Confirmed) {
    return (
      <div className="flex justify-end">
        <Button variant="teal" className="text-xs sm:text-sm" onClick={() => updateItem(original.id, { status: AppointmentStatus.CheckIn })}>
          Registrar chegada
        </Button>
      </div>
    )
  }

  if (today && original.status === AppointmentStatus.CheckIn) {
    return (
      <div className="flex justify-end">
        <Button variant="teal" className="text-xs sm:text-sm" onClick={() => onOpenPayment(original)}>
          Confirmar pagamento
        </Button>
      </div>
    )
  }

  if (today && original.status === AppointmentStatus.Paid) {
    return (
      <div className="flex justify-end">
        <Button
          variant="purple"
          className="text-xs sm:text-sm"
          disabled={loading}
          onClick={async () => {
            setLoading(true)
            try {
              const res = await fetch("/api/schedule", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  id: original.id,
                  status: AppointmentStatus.InProgress,
                  startTime: new Date().toISOString(),
                }),
              })
              const updated = await res.json()

              // Atualiza o cache apenas se ele já existir (retornar undefined não altera nada)
              queryClient.setQueryData<Appointment[]>(SCHEDULE_QUERY_KEY, (prev) =>
                prev?.map((item) => (item.id === original.id ? { ...item, ...updated } : item))
              )
              // Garante que a página de atendimentos busque dados frescos ao montar
              queryClient.invalidateQueries({ queryKey: SCHEDULE_QUERY_KEY })

              router.push("/attendance")
            } finally {
              setLoading(false)
            }
          }}
        >
          {loading ? "Aguarde..." : "Atender"}
        </Button>
      </div>
    )
  }

  if (original.status === AppointmentStatus.InProgress) {
    return (
      <div className="flex justify-end">
        <Button variant="purple" className="text-xs sm:text-sm" disabled>Atender</Button>
      </div>
    )
  }

  if (original.status === AppointmentStatus.Completed || original.status === AppointmentStatus.Cancelled) return null

  const showConfirmConsulta =
    original.status === AppointmentStatus.Scheduled ||
    original.status === AppointmentStatus.AwaitingConfirmation

  return (
    <div className="flex flex-wrap items-center justify-end gap-3">
      {showConfirmConsulta && (
        <Button
          variant="teal"
          className="text-xs sm:text-sm"
          onClick={() => updateItem(original.id, { status: AppointmentStatus.Confirmed })}
        >
          Confirmar consulta
        </Button>
      )}
      <Button variant="ghost" className="text-xs sm:text-sm" onClick={() => onReschedule(original)}>
        <Calendar size={12} /> Reagendar
      </Button>
      <Button variant="ghost-danger" className="text-xs sm:text-sm" onClick={() => updateItem(original.id, { status: AppointmentStatus.Cancelled })}>
        Cancelar
      </Button>
    </div>
  )
}

export function Table({ rows, setData }: TableProps) {
  const [selected, setSelected] = useState<Appointment | null>(null)
  const [paymentFor, setPaymentFor] = useState<Appointment | null>(null)
  const queryClient = useQueryClient()

  const updateItem = async (id: number, changes: Partial<Appointment>) => {
    const res = await fetch("/api/schedule", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...changes }),
    })
    const updated = await res.json()

    setData((prev) => prev.map((item) => item.id === id ? { ...item, ...updated } : item))

    queryClient.setQueryData<Appointment[]>(SCHEDULE_QUERY_KEY, (prev) =>
      prev?.map((item) => (item.id === id ? { ...item, ...updated } : item))
    )
  }

  const columns = [
    columnHelper.accessor((row: RowType) => (isDataRow(row) ? row.id : ""), {
      id: "id",
      header: "ID",
    }),
    columnHelper.accessor((row: RowType) => (isDataRow(row) ? row.slotTime : ""), {
      id: "slotTime",
      header: "Horário",
    }),
    columnHelper.display({
      id: "status",
      header: "Status",
      cell: ({ row }) => {
        const original = row.original
        if (!isDataRow(original)) return null
        return (
          <span
            className={`inline-block max-w-[9rem] rounded-lg px-2 py-1 text-center text-[11px] font-medium leading-snug sm:max-w-none sm:text-xs ${STATUS_STYLE[original.status] ?? ""}`}
          >
            <span className="line-clamp-2 break-words">{STATUS_LABEL[original.status] ?? original.status}</span>
          </span>
        )
      },
    }),
    columnHelper.display({
      id: "paciente",
      header: "Paciente",
      cell: ({ row }) => {
        const original = row.original
        if (!isDataRow(original)) return null
        const nome = original.patient?.name ?? original.patientName ?? "—"
        return (
          <span className="block max-w-[7rem] truncate sm:max-w-[10rem] md:max-w-[14rem]" title={nome}>
            {nome}
          </span>
        )
      },
    }),
    columnHelper.display({
      id: "profissional",
      header: "Médico",
      cell: ({ row }) => {
        const original = row.original
        if (!isDataRow(original)) return null
        const n = original.professionalName ?? "—"
        return (
          <span className="block max-w-[6rem] truncate sm:max-w-[9rem] md:max-w-[12rem]" title={n}>
            {n}
          </span>
        )
      },
    }),
    columnHelper.display({
      id: "actions",
      header: "Ações",
      cell: ({ row }) => {
        const original = row.original
        if (!isDataRow(original)) return null
        return (
          <ActionCell
            original={original}
            updateItem={updateItem}
            onReschedule={setSelected}
            onOpenPayment={setPaymentFor}
          />
        )
      },
    }),
  ]

  const table = useReactTable({ data: rows, columns, getCoreRowModel: getCoreRowModel() })

  return (
    <TableCard>
      <table className={`w-full min-w-[20rem] border-separate border-spacing-0 sm:min-w-0 ${table.getRowModel().rows.length === 0 ? "h-full" : ""}`}>
        <thead>
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id}>
              {hg.headers.map((header, i) => (
                <th
                  key={header.id}
                  style={{ width: `${100 / hg.headers.length}%` }}
                  className={`sticky top-0 z-10 whitespace-nowrap border-b border-gray-200 bg-gray-50 px-3 py-2.5 text-[11px] font-medium text-gray-500 sm:px-4 sm:py-3 sm:text-xs ${i === hg.headers.length - 1 ? "text-right" : "text-left"}`}
                >
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody className={table.getRowModel().rows.length === 0 ? "h-full" : undefined}>
          {table.getRowModel().rows.length === 0 ? (
            <tr className="h-full">
              <td
                colSpan={COLUMN_COUNT}
                className="px-3 py-16 text-center align-middle text-sm leading-relaxed text-gray-400"
              >
                Sem agendamento
              </td>
            </tr>
          ) : (
            table.getRowModel().rows.map((row) => {
              const original = row.original

              if (original.type === "day") {
                return (
                  <tr key={row.id}>
                    <td colSpan={COLUMN_COUNT} className="px-3 pt-4 pb-1 text-sm capitalize leading-snug text-gray-500 sm:px-4">{original.label}</td>
                  </tr>
                )
              }
              return (
                <tr key={row.id} className={`transition-colors hover:bg-gray-50/80 ${isDataRow(original) && original.status === AppointmentStatus.Cancelled ? "opacity-40" : ""}`}>
                  {row.getVisibleCells().map((cell, i, cells) => (
                    <Td key={cell.id} className={`align-middle ${i === cells.length - 1 ? "text-right" : ""}`}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </Td>
                  ))}
                </tr>
              )
            })
          )}
        </tbody>
      </table>

      {selected && (
        <ScheduleFormModal
          item={selected}
          mode="reschedule"
          onClose={() => setSelected(null)}
          onSuccess={(updated) => {
            setData((prev) => prev.map((item) => item.id === updated.id ? updated : item))
            setSelected(null)
          }}
        />
      )}

      {paymentFor && (
        <PaymentConfirmModal
          item={paymentFor}
          onClose={() => setPaymentFor(null)}
          onSuccess={(updated) => {
            setData((prev) => prev.map((item) => (item.id === updated.id ? { ...item, ...updated } : item)))
            queryClient.setQueryData<Appointment[]>(SCHEDULE_QUERY_KEY, (prev) =>
              prev?.map((item) => (item.id === updated.id ? { ...item, ...updated } : item))
            )
          }}
        />
      )}
    </TableCard>
  )
}
