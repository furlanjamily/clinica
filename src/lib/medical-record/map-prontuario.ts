import type { MedicalRecord } from "@/types"
import { toLocalDate, toLocalSlotTime } from "@/lib/datetime/appointment-time"

type NestedAppointment = {
  id?: number
  scheduledStart?: Date | string
  professionalNameSnapshot?: string | null
  patientNameSnapshot?: string | null
  patientId?: number
} | null

type RawMedicalRecord = Record<string, unknown> & {
  id?: number
  appointmentId?: number
  patientId?: number | null
  patientLabel?: string | null
  patientDetails?: MedicalRecord["patientDetails"] | null
  patient?: MedicalRecord["patientDetails"] | null
  appointment?: NestedAppointment
  createdAt?: Date | string
}

type MapOptions = { fallbackProfessionalName?: string }

function mapNestedAppointment(
  appointment: NestedAppointment | undefined,
  fallbackProfessionalName?: string
): MedicalRecord["appointment"] {
  if (!appointment) return undefined
  const start = appointment.scheduledStart ? new Date(appointment.scheduledStart) : undefined
  return {
    date: start ? toLocalDate(start) : undefined,
    slotTime: start ? toLocalSlotTime(start) : undefined,
    professionalName:
      appointment.professionalNameSnapshot ?? fallbackProfessionalName ?? undefined,
  }
}

export function mapMedicalRecordFromDb(
  raw: RawMedicalRecord,
  options: MapOptions = {}
): MedicalRecord {
  const relationPatient = (raw.patient ?? raw.patientDetails) as
    | MedicalRecord["patientDetails"]
    | undefined

  const name =
    relationPatient?.name?.trim() ||
    (typeof raw.patientLabel === "string" ? raw.patientLabel.trim() : "") ||
    raw.appointment?.patientNameSnapshot?.trim() ||
    ""

  const patientField =
    typeof raw.patientLabel === "string" && raw.patientLabel.trim()
      ? raw.patientLabel.trim()
      : name

  const resolvedPatientId =
    relationPatient?.id ?? raw.patientId ?? raw.appointment?.patientId ?? 0

  const patientDetails: MedicalRecord["patientDetails"] =
    relationPatient ?? (name ? { id: resolvedPatientId, name } : undefined)

  const createdAt =
    raw.createdAt instanceof Date ? raw.createdAt.toISOString() : raw.createdAt

  return {
    ...(raw as unknown as MedicalRecord),
    id: raw.id,
    appointmentId: raw.appointmentId as number,
    patientLabel: patientField,
    patientDetails,
    appointment: mapNestedAppointment(raw.appointment, options.fallbackProfessionalName),
    createdAt,
  }
}

/** @deprecated usar `mapMedicalRecordFromDb`; mantido para compatibilidade. */
export const mapClinicalChartFromDb = mapMedicalRecordFromDb
