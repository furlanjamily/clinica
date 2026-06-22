import type { MedicalRecord } from "@/types"

export type AppointmentPatient = {
  id: number
  name: string
  phone?: string | null
}

export type Appointment = {
  id: number
  date: string
  slotTime: string
  status: string

  patient: AppointmentPatient
  patientId?: number
  patientName?: string | null

  doctorId?: number

  professionalName: string

  startTime?: string
  endTime?: string
  accumulatedTime?: number
  /** `null` zera a pausa (atendimento retomado); `undefined` mantém o valor atual. */
  pausedAt?: string | null

  clinicalChart?: MedicalRecord | null

  transaction?: {
    id: number
    amount: number
    category: string
    type: string
    status: string
  } | null
}
