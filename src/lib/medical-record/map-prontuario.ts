import type { MedicalRecord } from "@/types"

type NestedAppointment = {
  id?: number
  date?: string
  slotTime?: string
  professionalName?: string | null
  patientName?: string | null
  patientId?: number
} | null

export function mapClinicalChartFromDb(
  raw: Record<string, unknown> & {
    id?: number
    appointmentId?: number
    patientId?: number | null
    patientLabel?: string | null
    patientDetails?: MedicalRecord["patientDetails"] | null
    patient?: MedicalRecord["patientDetails"] | null
    appointment?: NestedAppointment
    createdAt?: Date | string
  }
): MedicalRecord {
  const relationPatient = (raw.patient ?? raw.patientDetails) as MedicalRecord["patientDetails"] | undefined
  const name =
    relationPatient?.name?.trim() ||
    (typeof raw.patientLabel === "string" ? raw.patientLabel.trim() : "") ||
    raw.appointment?.patientName?.trim() ||
    ""

  const patientField =
    typeof raw.patientLabel === "string" && raw.patientLabel.trim()
      ? raw.patientLabel.trim()
      : name

  const resolvedPatientId =
    relationPatient?.id ?? raw.patientId ?? raw.appointment?.patientId ?? 0

  const patientDetails: MedicalRecord["patientDetails"] =
    relationPatient ??
    (name ? { id: resolvedPatientId, name } : undefined)

  const createdAt =
    raw.createdAt instanceof Date ? raw.createdAt.toISOString() : raw.createdAt

  return {
    ...(raw as unknown as MedicalRecord),
    id: raw.id,
    appointmentId: raw.appointmentId as number,
    patientLabel: patientField,
    patientDetails,
    appointment: raw.appointment
      ? {
          date: raw.appointment.date,
          slotTime: raw.appointment.slotTime,
          professionalName: raw.appointment.professionalName ?? undefined,
        }
      : undefined,
    createdAt,
  }
}
