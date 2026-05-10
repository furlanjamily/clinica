import type { MedicalRecord } from "@/types"
import type { Appointment, AppointmentPatient } from "./types"

export type DoctorInput = string | { id: number; name: string } | null | undefined

export type AppointmentRowInput = {
  id: number
  date: string
  slotTime: string
  status?: string | null
  patientId?: number | null
  patientName?: string | null
  doctor: DoctorInput
  startTime?: string | null
  endTime?: string | null
  accumulatedTime?: number | null
  pausedAt?: string | null
  patient?: { id: number; name: string; phone?: string | null } | null
  clinicalChart?: unknown | null
  transaction?: {
    id: number
    amount: number
    category: string
    type: string
    status: string
  } | null
}

function resolvePatient(row: AppointmentRowInput): AppointmentPatient {
  if (row.patient) return { id: row.patient.id, name: row.patient.name, phone: row.patient.phone }
  return {
    id: row.patientId ?? 0,
    name: (row.patientName ?? "").trim() || "Patient",
  }
}

function resolveProfessionalName(doctor: DoctorInput): string {
  if (doctor == null) return ""
  if (typeof doctor === "string") return doctor
  return doctor.name ?? ""
}

function normalizeClinicalChart(row: AppointmentRowInput, clinicalChart: unknown): MedicalRecord | null {
  if (clinicalChart == null) return null
  const raw = clinicalChart as Record<string, unknown>
  const base = {
    ...raw,
    patientDetails: (raw.patientDetails ?? raw.patient) as MedicalRecord["patientDetails"],
  } as MedicalRecord
  const professionalName =
    base.appointment?.professionalName?.trim() ||
    resolveProfessionalName(row.doctor)

  const patientDisplayName =
    base.patientDetails?.name?.trim() ||
    base.patientLabel?.trim() ||
    row.patient?.name?.trim() ||
    (row.patientName ?? "").trim() ||
    ""

  const patientMerged: MedicalRecord["patientDetails"] = base.patientDetails
    ? { ...(row.patient ?? {}), ...base.patientDetails }
    : row.patient
      ? { id: row.patient.id, name: row.patient.name, phone: row.patient.phone }
      : patientDisplayName
        ? { id: row.patientId ?? 0, name: patientDisplayName }
        : undefined

  return {
    ...base,
    patientLabel: base.patientLabel?.trim() || patientDisplayName || "",
    patientDetails: patientMerged,
    appointment: {
      ...(typeof base.appointment === "object" && base.appointment ? base.appointment : {}),
      date: base.appointment?.date ?? row.date,
      slotTime: base.appointment?.slotTime ?? row.slotTime,
      professionalName,
    },
  }
}

export function toAppointment(row: AppointmentRowInput): Appointment {
  const patient = resolvePatient(row)
  const clinicalChart = normalizeClinicalChart(row, row.clinicalChart)
  const professionalName = resolveProfessionalName(row.doctor)

  return {
    id: row.id,
    date: row.date,
    slotTime: row.slotTime,
    status: row.status ?? "Agendado",
    patient,
    patientId: row.patientId ?? undefined,
    patientName: row.patientName ?? null,
    professionalName,
    startTime: row.startTime ?? undefined,
    endTime: row.endTime ?? undefined,
    accumulatedTime: row.accumulatedTime ?? undefined,
    pausedAt: row.pausedAt ?? undefined,
    clinicalChart,
    transaction: row.transaction
      ? {
          id: row.transaction.id,
          amount: row.transaction.amount,
          category: row.transaction.category,
          type: row.transaction.type,
          status: row.transaction.status,
        }
      : null,
  }
}
