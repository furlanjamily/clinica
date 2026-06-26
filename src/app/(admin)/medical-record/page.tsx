"use client"

import { useState } from "react"
import type { MedicalRecord } from "@/types"
import { MedicalRecordModal } from "@/components/medical-record/MedicalRecordModal"
import { Plus, Download, Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/ui/PageHeader"
import { TableSuspense } from "@/components/ui/TableSuspense"
import { DataTable, Td } from "@/components/ui/table/DataTable"
import { useMedicalRecords, useMedicalRecordMutations } from "@/hooks/useMedicalRecord"
import { downloadMedicalRecordPdf } from "@/lib/medical-record/download-pdf"

function MedicalRecordsTable({
  onEdit,
  onDelete,
  onDownload,
}: {
  onEdit: (r: MedicalRecord) => void
  onDelete: (id: number) => void
  onDownload: (r: MedicalRecord) => void
}) {
  const { data: records } = useMedicalRecords()

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
      minWidthClassName="min-w-[32.5rem]"
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
  const { saveRecord, removeRecord } = useMedicalRecordMutations()
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<MedicalRecord | null>(null)

  async function handleSave(data: Partial<MedicalRecord> & { appointmentId: number }) {
    if (!data.appointmentId) {
      toast.error("Agendamento não identificado.")
      return
    }

    const saved = await saveRecord(data, { editingId: editing?.id })
    if (!saved) return

    toast.success(editing ? "Prontuário atualizado." : "Prontuário criado com sucesso!")
    setShowModal(false)
    setEditing(null)
  }

  async function handleDelete(id: number) {
    await removeRecord(id)
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
