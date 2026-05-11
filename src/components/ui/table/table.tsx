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
import { useQueryClient } from "@tanstack/react-query"
import { SCHEDULE_QUERY_KEY } from "@/hooks/useScheduleQuery"

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

const statusStyle: Record<string, string> = {
  Agendado: "bg-yellow-100 text-yellow-700",
  AguardandoConfirmacao: "bg-orange-100 text-orange-700",
  Confirmado: "bg-green-100 text-green-700",
  RegistrarChegada: "bg-blue-100 text-blue-700",
  AguardandoPagamento: "bg-pink-100 text-pink-700",
  Pago: "bg-teal-100 text-teal-700",
  Cancelado: "bg-red-100 text-red-700",
  "Em Atendimento": "bg-purple-100 text-purple-700",
  Concluido: "bg-gray-200 text-gray-600",
  Reagendado: "bg-blue-100 text-blue-700",
}

const statusLabel: Record<string, string> = {
  Agendado: "Agendado",
  AguardandoConfirmacao: "Aguardando Confirmação",
  Confirmado: "Confirmado",
  RegistrarChegada: "Registrar chegada",
  AguardandoPagamento: "Aguardando Pagamento",
  Pago: "Pago",
  Cancelado: "Cancelado",
  "Em Atendimento": "Em Atendimento",
  Concluido: "Concluído",
  Reagendado: "Reagendado",
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

  if (today && original.status === "Confirmado") {
    return (
      <Button variant="teal" className="text-xs sm:text-sm" onClick={() => updateItem(original.id, { status: "RegistrarChegada" })}>
        Registrar chegada
      </Button>
    )
  }

  if (today && original.status === "RegistrarChegada") {
    return (
      <Button variant="teal" className="text-xs sm:text-sm" onClick={() => onOpenPayment(original)}>
        Confirmar pagamento
      </Button>
    )
  }

  if (today && original.status === "Pago") {
    return (
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
                status: "Em Atendimento",
                startTime: new Date().toISOString(),
              }),
            })
            const updated = await res.json()

            queryClient.setQueryData<Appointment[]>(SCHEDULE_QUERY_KEY, (prev) =>
              prev?.map((item) => (item.id === original.id ? { ...item, ...updated } : item)) ?? []
            )

            router.push("/attendance")
          } finally {
            setLoading(false)
          }
        }}
      >
        {loading ? "Aguarde..." : "Atender"}
      </Button>
    )
  }

  if (original.status === "Em Atendimento") {
    return <Button variant="purple" className="text-xs sm:text-sm" disabled>Atender</Button>
  }

  if (original.status === "Concluido" || original.status === "Cancelado") return null

  const showConfirmConsulta =
    original.status === "Agendado" || original.status === "AguardandoConfirmacao"

  return (
    <div className=" flex flex-wrap items-center gap-3">
      {showConfirmConsulta && (
        <Button
          variant="teal"
          className="text-xs sm:text-sm"
          onClick={() => updateItem(original.id, { status: "Confirmado" })}
        >
          Confirmar consulta
        </Button>
      )}
      <Button variant="ghost" className="text-xs sm:text-sm" onClick={() => onReschedule(original)}>
        <Calendar size={12} /> Reagendar
      </Button>
      <Button variant="ghost-danger" className="text-xs sm:text-sm" onClick={() => updateItem(original.id, { status: "Cancelado" })}>
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
      prev?.map((item) => (item.id === id ? { ...item, ...updated } : item)) ?? []
    )
  }

  const columns = [
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
            className={`inline-block max-w-[9rem] rounded-lg px-2 py-1 text-center text-[11px] font-medium leading-snug sm:max-w-none sm:text-xs ${statusStyle[original.status] ?? ""}`}
          >
            <span className="line-clamp-2 break-words">{statusLabel[original.status] ?? original.status}</span>
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
    <div className="h-full min-w-0 overflow-x-auto overflow-y-auto [-webkit-overflow-scrolling:touch]">
      <table className="w-full min-w-[20rem] border-separate border-spacing-y-2 sm:min-w-0">
        <thead>
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id}>
              {hg.headers.map((header) => (
                <th key={header.id} className="whitespace-nowrap px-2 py-1 text-left text-[11px] font-medium text-gray-500 sm:px-2 sm:text-xs">
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.length === 0 ? (
            <tr>
              <td colSpan={COLUMN_COUNT} className="text-center text-sm text-accent py-8">
                Sem agendamento
              </td>
            </tr>
          ) : (
            table.getRowModel().rows.map((row) => {
              const original = row.original

              if (original.type === "day") {
                return (
                  <tr key={row.id}>
                    <td colSpan={COLUMN_COUNT} className="pt-3 text-sm capitalize leading-snug text-gray-500">{original.label}</td>
                  </tr>
                )
              }
              return (
                <tr key={row.id} className={`rounded-md bg-white shadow-sm ${isDataRow(original) && original.status === "Cancelado" ? "opacity-40" : ""}`}>
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="p-1.5 align-middle sm:p-2">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
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
              prev?.map((item) => (item.id === updated.id ? { ...item, ...updated } : item)) ?? []
            )
          }}
        />
      )}
    </div>
  )
}
