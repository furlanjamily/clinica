"use client"

import { useState } from "react"
import type { MedicalRecord } from "@/types"
import { MedicalRecordModal } from "@/components/medical-record/MedicalRecordModal"
import { Plus, Download, Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/ui/PageHeader"
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query"
import { TableSuspense } from "@/components/ui/TableSuspense"
import { absoluteUrl } from "@/lib/absolute-url"

const QUERY_KEY = ["medical-records"] as const

function MedicalRecordsTable({
  onEdit,
  onDelete,
  onDownload,
}: {
  onEdit: (r: MedicalRecord) => void
  onDelete: (id: number) => void
  onDownload: (r: MedicalRecord) => void
}) {
  const { data: records } = useSuspenseQuery<MedicalRecord[]>({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      try {
        const res = await fetch(absoluteUrl("/api/medical-record"))
        const payload: unknown = await res.json()
        return Array.isArray(payload) ? (payload as MedicalRecord[]) : []
      } catch {
        return []
      }
    },
  })

  if (records.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-accent text-sm">
        Nenhum prontuário cadastrado
      </div>
    )
  }

  return (
    <div className="min-w-0 overflow-x-auto">
      <table className="w-full min-w-[520px] border-separate border-spacing-y-2">
      <thead>
        <tr>
          {["Paciente", "Médico", "Data", "Ações"].map((h) => (
            <th key={h} className="text-left text-xs px-3 text-gray-500">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {records.map((r) => (
          <tr key={r.id} className="bg-white shadow-sm">
            <td className="max-w-[12rem] break-words p-3">{r.patientDetails?.name || "—"}</td>
            <td className="max-w-[10rem] break-words p-3 text-gray-600">{r.appointment?.professionalName || "—"}</td>
            <td className="whitespace-nowrap p-3 text-gray-600 sm:whitespace-normal">
              {r.createdAt ? new Date(r.createdAt).toLocaleString("pt-BR") : "—"}
            </td>
            <td className="p-3">
              <div className="flex flex-wrap gap-2 sm:gap-3">
                <Button variant="ghost-blue" onClick={() => onDownload(r)}>
                  <Download size={14} /> PDF
                </Button>
                <Button variant="ghost" onClick={() => onEdit(r)}>
                  <Pencil size={14} /> Editar
                </Button>
                <Button variant="ghost-danger" onClick={() => onDelete(r.id!)}>
                  <Trash2 size={14} /> Apagar
                </Button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
    </div>
  )
}

export default function MedicalRecordPage() {
  const queryClient = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<MedicalRecord | null>(null)

  function setRecords(updater: (prev: MedicalRecord[]) => MedicalRecord[]) {
    queryClient.setQueryData<MedicalRecord[]>(QUERY_KEY, (prev) => updater(prev ?? []))
  }

  async function handleSave(data: Partial<MedicalRecord> & { appointmentId: number }) {
    if (!data.appointmentId) {
      toast.error("Agendamento não identificado.")
      return
    }
    try {
      if (editing) {
        const res = await fetch(absoluteUrl("/api/medical-record"), {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...data, id: editing.id }),
        })
        const updated: MedicalRecord = await res.json()
        setRecords((prev) => prev.map((r) => (r.id === updated.id ? updated : r)))
        toast.success("Prontuário atualizado.")
      } else {
        const res = await fetch(absoluteUrl("/api/medical-record"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        })
        const created: MedicalRecord = await res.json()
        setRecords((prev) => [created, ...prev])
        toast.success("Prontuário criado com sucesso!")
      }
    } catch {
      toast.error("Erro ao salvar prontuário")
    }
    setShowModal(false)
    setEditing(null)
  }

  async function handleDelete(id: number) {
    try {
      await fetch(absoluteUrl("/api/medical-record"), {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })
      setRecords((prev) => prev.filter((r) => r.id !== id))
      toast.success("Prontuário apagado.")
    } catch {
      toast.error("Erro ao deletar")
    }
  }

  async function handleDownload(record: MedicalRecord) {
    const [{ pdf }, { MedicalRecordPDF }] = await Promise.all([
      import("@react-pdf/renderer"),
      import("@/components/MedicalRecordPDF"),
    ])
    const blob = await pdf(<MedicalRecordPDF data={record} />).toBlob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    const base =
      record.patientLabel ||
      record.patientDetails?.name ||
      "paciente"
    a.download = `prontuario-${base.replace(/\s+/g, "-").toLowerCase()}.pdf`
    a.click()
    URL.revokeObjectURL(url)
    toast.success("PDF gerado com sucesso!")
  }

  return (
    <div className="flex h-full min-h-0 min-w-0 max-w-full flex-col">
      <Header title="Prontuários">
        <Button onClick={() => { setEditing(null); setShowModal(true) }}>
          <Plus size={16} /> Novo Prontuário
        </Button>
      </Header>

      <div className="mt-4 min-h-0 min-w-0 flex-1 overflow-auto">
        <TableSuspense cols={4} rows={5}>
          <MedicalRecordsTable
            onEdit={(r) => { setEditing(r); setShowModal(true) }}
            onDelete={handleDelete}
            onDownload={handleDownload}
          />
        </TableSuspense>
      </div>

      {showModal && (
        <MedicalRecordModal
          data={editing ?? undefined}
          visit={{
            id: editing?.appointmentId ?? 0,
            date: editing?.appointment?.date ?? undefined,
            patientName:
              editing?.patientDetails?.name ||
              editing?.patientLabel ||
              "",
            professionalName: editing?.appointment?.professionalName ?? undefined,
            slotTime: editing?.appointment?.slotTime ?? "",
          }}
          onClose={() => { setShowModal(false); setEditing(null) }}
          onSave={handleSave}
        />
      )}
    </div>
  )
}
