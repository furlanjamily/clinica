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
import type { Atendimento } from "@/types/types"
import { RowType } from "@/types/rowType"
import { ScheduleFormModal } from "@/components/schedule/ScheduleFormModal"
import { Button } from "@/components/ui/button"
import { useQueryClient } from "@tanstack/react-query"
import { SCHEDULE_QUERY_KEY } from "@/hooks/useScheduleQuery"

function isDataRow(row: RowType): row is { type: "data" } & Atendimento {
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

function elapsed(isoTime?: string) {
  if (!isoTime) return "00:00"
  const diff = Math.floor((Date.now() - new Date(isoTime).getTime()) / 1000)
  const m = Math.floor(diff / 60).toString().padStart(2, "0")
  const s = (diff % 60).toString().padStart(2, "0")
  return `${m}:${s}`
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
  setData: React.Dispatch<React.SetStateAction<Atendimento[]>>
}

const columnHelper = createColumnHelper<RowType>()

function ActionCell({ original, updateItem, onReschedule }: {
  original: Atendimento
  updateItem: (id: number, changes: Partial<Atendimento>) => Promise<void>
  onReschedule: (item: Atendimento) => void
}) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const today = isToday(original.data)
  const [loading, setLoading] = useState(false)

  // No dia + Confirmado → Registrar chegada
  if (today && original.status === "Confirmado") {
    return (
      <Button variant="teal" onClick={() => updateItem(original.id, { status: "RegistrarChegada" })}>
        Registrar chegada
      </Button>
    )
  }

  // RegistrarChegada → Confirmar pagamento
  if (today && original.status === "RegistrarChegada") {
    return (
      <Button variant="teal" onClick={() => updateItem(original.id, { status: "Pago" })}>
        Confirmar pagamento
      </Button>
    )
  }

  // Pago → Atender: aguarda PATCH, atualiza cache e navega
  if (today && original.status === "Pago") {
    return (
      <Button
        variant="purple"
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

            // Atualiza o cache antes de navegar — a página de atendimento já vai ver o dado
            queryClient.setQueryData<Atendimento[]>(SCHEDULE_QUERY_KEY, (prev) =>
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

  // Em Atendimento → botão desabilitado
  if (original.status === "Em Atendimento") {
    return <Button variant="purple" disabled>Atender</Button>
  }

  // Concluído ou Cancelado → sem ação
  if (original.status === "Concluido" || original.status === "Cancelado") return null

  // Qualquer outro status → Reagendar + Cancelar
  return (
    <div className="flex items-center gap-3">
      <Button variant="ghost" onClick={() => onReschedule(original)}>
        <Calendar size={12} /> Reagendar
      </Button>
      <Button variant="ghost-danger" onClick={() => updateItem(original.id, { status: "Cancelado" })}>
        Cancelar
      </Button>
    </div>
  )
}

export function Table({ rows, setData }: TableProps) {
  const [selected, setSelected] = useState<Atendimento | null>(null)
  const queryClient = useQueryClient()

  const updateItem = async (id: number, changes: Partial<Atendimento>) => {
    const res = await fetch("/api/schedule", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...changes }),
    })
    const updated = await res.json()

    // Atualiza o estado local da agenda
    setData((prev) => prev.map((item) => item.id === id ? { ...item, ...updated } : item))

    // Mantém o cache do React Query sincronizado
    queryClient.setQueryData<Atendimento[]>(SCHEDULE_QUERY_KEY, (prev) =>
      prev?.map((item) => (item.id === id ? { ...item, ...updated } : item)) ?? []
    )
  }

  const columns = [
    columnHelper.accessor((row: RowType) => (isDataRow(row) ? row.horario : ""), { id: "horario", header: "Horário" }),
    columnHelper.accessor((row: RowType) => (isDataRow(row) ? row.data : ""), { id: "atendimento", header: "Atendimento" }),
    columnHelper.display({
      id: "status",
      header: "Status",
      cell: ({ row }) => {
        const original = row.original
        if (!isDataRow(original)) return null
        return (
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusStyle[original.status] ?? ""}`}>
            {statusLabel[original.status] ?? original.status}
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
        return original.paciente.nome
      }
    }),
    columnHelper.accessor((row) => (isDataRow(row) ? (row.profissionalNome ?? "") : ""), { id: "profissional", header: "Médico" }),
    columnHelper.display({
      id: "actions",
      header: "Ações",
      cell: ({ row }) => {
        const original = row.original
        if (!isDataRow(original)) return null
        return <ActionCell original={original} updateItem={updateItem} onReschedule={setSelected} />
      },
    }),
  ]

  const table = useReactTable({ data: rows, columns, getCoreRowModel: getCoreRowModel() })

  return (
    <div className="h-full overflow-auto">
      <table className="w-full border-separate border-spacing-y-2">
        <thead>
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id}>
              {hg.headers.map((header) => (
                <th key={header.id} className="text-left text-xs px-2">
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => {
            const original = row.original

            if (original.type === "day") {
              return (
                <tr key={row.id}>
                  <td colSpan={5} className="pt-2 text-sm text-gray-500 capitalize">{original.label}</td>
                </tr>
              )
            }
            return (
              <tr key={row.id} className={`bg-white shadow-sm rounded-md ${isDataRow(original) && original.status === "Cancelado" ? "opacity-40" : ""}`}>
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="p-2">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            )
          })}
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
    </div>
  )
}
