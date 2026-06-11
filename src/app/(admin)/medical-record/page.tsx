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
import { DataTable, Td } from "@/components/ui/table/DataTable"
import { absoluteUrl } from "@/lib/absolute-url"
import { downloadMedicalRecordPdf } from "@/lib/medical-record/download-pdf"

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

  return (
    <DataTable<MedicalRecord>
      headers={[
        { label: "Paciente", sort: (r) => r.patientDetails?.name || null },
        { label: "Médico", sort: (r) => r.appointment?.professionalName || null },
        { label: "Data", sort: (r) => (r.createdAt ? new Date(r.createdAt).getTime() : null) },
        { label: "Ações", align: "right" },
      ]}
      data={records}
      emptyMessage="Nenhum prontuário cadastrado"
      minWidthClassName="min-w-[min(100%,32.5rem)] sm:min-w-[520px]"
      renderRow={(r) => (
        <tr key={r.id} className="transition-colors hover:bg-gray-50/80">
          <Td className="max-w-[12rem] break-words font-medium">{r.patientDetails?.name || "—"}</Td>
          <Td className="max-w-[10rem] break-words text-gray-600">{r.appointment?.professionalName || "—"}</Td>
          <Td className="whitespace-nowrap text-gray-600 sm:whitespace-normal">
            {r.createdAt ? new Date(r.createdAt).toLocaleString("pt-BR") : "—"}
          </Td>
          <Td>
            <div className="flex flex-wrap justify-end gap-2 sm:gap-3">
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
          </Td>
        </tr>
      )}
    />
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
        if (!res.ok) throw new Error("Falha ao atualizar prontuário")
        const updated: MedicalRecord = await res.json()
        setRecords((prev) => prev.map((r) => (r.id === updated.id ? updated : r)))
        toast.success("Prontuário atualizado.")
      } else {
        const res = await fetch(absoluteUrl("/api/medical-record"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        })
        if (!res.ok) throw new Error("Falha ao criar prontuário")
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
      const res = await fetch(absoluteUrl("/api/medical-record"), {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })
      if (!res.ok) throw new Error("Falha ao apagar prontuário")
      setRecords((prev) => prev.filter((r) => r.id !== id))
      toast.success("Prontuário apagado.")
    } catch {
      toast.error("Erro ao deletar")
    }
  }

  return (
    <div className="flex h-full min-h-0 min-w-0 max-w-full flex-col">
      <Header title="Prontuários">
        <Button onClick={() => { setEditing(null); setShowModal(true) }}>
          <Plus size={16} /> Novo Prontuário
        </Button>
      </Header>

      <div className="mt-4 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <TableSuspense cols={4} rows={5}>
          <MedicalRecordsTable
            onEdit={(r) => { setEditing(r); setShowModal(true) }}
            onDelete={handleDelete}
            onDownload={downloadMedicalRecordPdf}
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
