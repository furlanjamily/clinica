import type { MedicalRecord } from "@/types"
import type { Appointment, AppointmentPatient } from "./types"
import { toLocalDate, toLocalSlotTime } from "@/lib/datetime/appointment-time"
import { mapMedicalRecordFromDb } from "@/lib/medical-record/map-prontuario"
import { AppointmentStatus } from "@/lib/schedule/status"

export type DoctorInput = string | { id: number; name: string } | null | undefined

export type AppointmentRowInput = {
  id: number
  scheduledStart: Date
  status?: string | null
  patientId?: number | null
  doctorId?: number | null
  patientNameSnapshot?: string | null
  professionalNameSnapshot?: string | null
  doctor?: DoctorInput
  startedAt?: Date | null
  endedAt?: Date | null
  accumulatedMs?: number | null
  pausedAt?: Date | null
  patient?: { id: number; name: string; phone?: string | null; image?: string | null } | null
  medicalRecord?: unknown | null
  transaction?: {
    id: number
    amount: number | { toString(): string }
    category: string
    type: string
    status: string
  } | null
}

function resolvePatient(row: AppointmentRowInput): AppointmentPatient {
  if (row.patient) {
    return {
      id: row.patient.id,
      name: row.patient.name,
      phone: row.patient.phone,
      image: row.patient.image,
    }
  }
  return {
    id: row.patientId ?? 0,
    name: (row.patientNameSnapshot ?? "").trim() || "Patient",
  }
}

function resolveProfessionalName(row: AppointmentRowInput): string {
  const doctor = row.doctor
  if (typeof doctor === "string") return doctor
  if (doctor && doctor.name) return doctor.name
  return (row.professionalNameSnapshot ?? "").trim()
}

function isoOrUndefined(value: Date | null | undefined): string | undefined {
  return value ? value.toISOString() : undefined
}

export function toAppointment(row: AppointmentRowInput): Appointment {
  const patient = resolvePatient(row)
  const professionalName = resolveProfessionalName(row)
  const clinicalChart = row.medicalRecord
    ? mapMedicalRecordFromDb(row.medicalRecord as Record<string, unknown>, {
        fallbackProfessionalName: professionalName,
      })
    : null

  return {
    id: row.id,
    date: toLocalDate(row.scheduledStart),
    slotTime: toLocalSlotTime(row.scheduledStart),
    status: row.status ?? AppointmentStatus.Scheduled,
    patient,
    patientId: row.patientId ?? undefined,
    doctorId: row.doctorId ?? undefined,
    patientName: row.patientNameSnapshot ?? null,
    professionalName,
    startTime: isoOrUndefined(row.startedAt),
    endTime: isoOrUndefined(row.endedAt),
    accumulatedTime: row.accumulatedMs ?? undefined,
    pausedAt: isoOrUndefined(row.pausedAt),
    clinicalChart,
    transaction: row.transaction
      ? {
          id: row.transaction.id,
          amount: Number(row.transaction.amount),
          category: row.transaction.category,
          type: row.transaction.type,
          status: row.transaction.status,
        }
      : null,
  }
}
