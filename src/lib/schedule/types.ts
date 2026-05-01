import { MedicalRecord } from "@/types"

export type Patient = {
  id: number
  nome: string
  telefone?: string | null
}

export type Appointment = {
  id: number

  paciente: {
    id: number
    nome: string
  }

  pacienteId?: number

  profissionalNome: string

  data: string
  horario: string
  status: string

  startTime?: string
  endTime?: string
  accumulatedTime?: number
  pausedAt?: string

  prontuario?: MedicalRecord | null
}