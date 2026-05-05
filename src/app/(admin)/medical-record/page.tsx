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
    queryFn: () => fetch(absoluteUrl("/api/medical-record")).then((r) => r.json()),
  })

  if (records.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-accent text-sm">
        Nenhum prontuário cadastrado
      </div>
    )
  }

  return (
    <table className="w-full border-separate border-spacing-y-2">
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
            <td className="p-3">{r.paciente?.nome || "—"}</td>
            <td className="p-3 text-gray-600">{r.agendamento?.profissionalNome || "—"}</td>
            <td className="p-3 text-gray-600">
              {r.createdAt ? new Date(r.createdAt).toLocaleString("pt-BR") : "—"}
            </td>
            <td className="p-3">
              <div className="flex gap-3">
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
  )
}

export default function MedicalRecordPage() {
  const queryClient = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<MedicalRecord | null>(null)

  function setRecords(updater: (prev: MedicalRecord[]) => MedicalRecord[]) {
    queryClient.setQueryData<MedicalRecord[]>(QUERY_KEY, (prev) => updater(prev ?? []))
  }

  async function handleSave(data: any) {
    if (!data.atendimentoId) { toast.error("Atendimento não identificado."); return }
    const payload = { ...data, agendamentoId: data.atendimentoId }
    try {
      if (editing) {
        const res = await fetch(absoluteUrl("/api/medical-record"), {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, id: editing.id }),
        })
        const updated: MedicalRecord = await res.json()
        setRecords((prev) => prev.map((r) => (r.id === updated.id ? updated : r)))
        toast.success("Prontuário atualizado.")
      } else {
        const res = await fetch(absoluteUrl("/api/medical-record"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        const created: MedicalRecord = await res.json()
        setRecords((prev) => [created, ...prev])
        toast.success("Prontuário criado com sucesso!")
      }
    } catch { toast.error("Erro ao salvar prontuário") }
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
    } catch { toast.error("Erro ao deletar") }
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
    a.download = `prontuario-${(record.patient ?? "paciente").replace(/\s+/g, "-").toLowerCase()}.pdf`
    a.click()
    URL.revokeObjectURL(url)
    toast.success("PDF gerado com sucesso!")
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <Header title="Prontuários">
        <Button onClick={() => { setEditing(null); setShowModal(true) }}>
          <Plus size={16} /> Novo Prontuário
        </Button>
      </Header>

      <div className="flex-1 overflow-auto mt-4">
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
          atendimento={{
            id: editing?.agendamentoId ?? 0,
            data: editing?.agendamento?.data ?? undefined,
            pacienteNome: editing?.paciente?.nome || editing?.patient || "",
            profissionalNome: editing?.agendamento?.profissionalNome ?? undefined,
            horario: editing?.agendamento?.horario ?? "",
          }}
          onClose={() => { setShowModal(false); setEditing(null) }}
          onSave={handleSave}
        />
      )}
    </div>
  )
}