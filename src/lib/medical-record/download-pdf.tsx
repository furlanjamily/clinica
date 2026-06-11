import { toast } from "sonner"
import type { MedicalRecord } from "@/types"

function buildFileName(record: MedicalRecord): string {
  const base =
    record.patientDetails?.name || record.patientLabel || "paciente"
  return `prontuario-${base.replace(/\s+/g, "-").toLowerCase()}.pdf`
}

/**
 * Gera e baixa o PDF do prontuário. Os módulos de PDF são importados
 * dinamicamente para não entrar no bundle inicial.
 */
export async function downloadMedicalRecordPdf(record: MedicalRecord): Promise<void> {
  const [{ pdf }, { MedicalRecordPDF }] = await Promise.all([
    import("@react-pdf/renderer"),
    import("@/components/MedicalRecordPDF"),
  ])

  const blob = await pdf(<MedicalRecordPDF data={record} />).toBlob()
  const url = URL.createObjectURL(blob)

  const link = document.createElement("a")
  link.href = url
  link.download = buildFileName(record)
  link.click()

  URL.revokeObjectURL(url)
  toast.success("PDF gerado com sucesso!")
}
