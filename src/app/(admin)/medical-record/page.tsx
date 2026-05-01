"use client"

import { useEffect, useState } from "react"
import type { MedicalRecord } from "@/types"
import { MedicalRecordModal } from "@/components/medical-record/MedicalRecordModal"
import { pdf } from "@react-pdf/renderer"
import { MedicalRecordPDF } from "@/components/MedicalRecordPDF"
import { Plus, Download, Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { TableSkeleton } from "@/components/ui/TableSkeleton"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/ui/PageHeader"

export default function MedicalRecordPage() {
  const [records, setRecords] = useState<MedicalRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<MedicalRecord | null>(null)

  /* =========================
     LOAD
  ========================= */
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/medical-record")
        const data = await res.json()
        setRecords(data)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  /* =========================
     SAVE
  ========================= */
  async function handleSave(data: {
    clinicalDiagnosis?: string
    diagnosisReactions?: string
    emotionalState?: string
    personalHistory?: string
    psychicExam?: string
    psychologicalConduct?: string
    familyGuidance?: string
    atendimentoId: number
  }) {
    if (!data.atendimentoId) {
      toast.error("Atendimento não identificado.")
      return
    }

    const payload = {
      ...data,
      agendamentoId: data.atendimentoId,
    }

    try {
      if (editing) {
        const res = await fetch("/api/medical-record", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...payload,
            id: editing.id,
          }),
        })

        const updated: MedicalRecord = await res.json()

        setRecords((prev) =>
          prev.map((r) => (r.id === updated.id ? updated : r))
        )

        toast.success("Prontuário atualizado.")
      } else {
        const res = await fetch("/api/medical-record", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })

        const created: MedicalRecord = await res.json()

        setRecords((prev) => [created, ...prev]) // 👈 já joga no topo

        toast.success("Prontuário criado com sucesso!")
      }
    } catch (e) {
      toast.error("Erro ao salvar prontuário")
    }

    setShowModal(false)
    setEditing(null)
  }

  /* =========================
     DELETE
  ========================= */
  async function handleDelete(id: number) {
    try {
      await fetch("/api/medical-record", {
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

  /* =========================
     DOWNLOAD PDF
  ========================= */
  async function handleDownload(record: MedicalRecord) {
    const [{ pdf }, { MedicalRecordPDF }] = await Promise.all([
      import("@react-pdf/renderer"),
      import("@/components/MedicalRecordPDF"),
    ])

    const blob = await pdf(<MedicalRecordPDF data={record} />).toBlob()

    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url

    const patientName =
      (record.patient ?? "paciente").replace(/\s+/g, "-").toLowerCase()

    a.download = `prontuario-${patientName}.pdf`
    a.click()

    URL.revokeObjectURL(url)
    toast.success("PDF gerado com sucesso!")
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <Header title="Prontuários">
        <Button
          onClick={() => {
            setEditing(null)
            setShowModal(true)
          }}
        >
          <Plus size={16} /> Novo Prontuário
        </Button>
      </Header>

      <div className="flex-1 overflow-auto">
        {loading ? (
          <TableSkeleton cols={4} rows={5} />
        ) : records.length === 0 ? (
          <div className="flex items-center justify-center h-full text-accent text-sm">
            Nenhum prontuário cadastrado
          </div>
        ) : (
          <table className="w-full border-separate border-spacing-y-2">
            <thead>
              <tr>
                {["Paciente", "Médico", "Data", "Ações"].map((h) => (
                  <th key={h} className="text-left text-xs px-3 text-gray-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {records.map((r) => (
                <tr key={r.id} className="bg-white shadow-sm">
                  <td className="p-3">
                    {r.paciente?.nome || "—"}
                  </td>

                  <td className="p-3 text-gray-600">
                    {r.agendamento?.profissionalNome || "—"}
                  </td>

                  <td className="p-3 text-gray-600">
                    {r.createdAt
                      ? new Date(r.createdAt).toLocaleString("pt-BR")
                      : "—"}
                  </td>

                  <td className="p-3">
                    <div className="flex gap-3">
                      <Button
                        variant="ghost-blue"
                        onClick={() => handleDownload(r)}
                      >
                        <Download size={14} /> PDF
                      </Button>

                      <Button
                        variant="ghost"
                        onClick={() => {
                          setEditing(r)
                          setShowModal(true)
                        }}
                      >
                        <Pencil size={14} /> Editar
                      </Button>

                      <Button
                        variant="ghost-danger"
                        onClick={() => handleDelete(r.id!)}
                      >
                        <Trash2 size={14} /> Apagar
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* MODAL */}
      {showModal && (
        <MedicalRecordModal
          data={editing ?? undefined}
          atendimento={{
            id: editing?.agendamentoId ?? 0,
            pacienteNome: editing?.paciente?.nome || "",
            profissionalNome: editing?.agendamento?.profissionalNome,
            horario: editing?.agendamento?.horario || "",
          }}
          onClose={() => {
            setShowModal(false)
            setEditing(null)
          }}
          onSave={handleSave}
        />
      )}
    </div>
  )
}