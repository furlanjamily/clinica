import type { MedicalRecord } from "@/types"

/** Paciente embutido no agendamento (include/select da API). */
export type AtendimentoPaciente = {
  id: number
  nome: string
  telefone?: string | null
}

/**
 * Agendamento exposto pela API (`toAppointment`) e usado na UI como `Atendimento`.
 */
export type Appointment = {
  id: number
  data: string
  horario: string
  status: string

  paciente: AtendimentoPaciente
  pacienteId?: number
  /** Denormalizado no banco; útil quando `paciente` não veio no payload. */
  pacienteNome?: string | null

  profissionalNome: string

  startTime?: string
  endTime?: string
  accumulatedTime?: number
  pausedAt?: string

  prontuario?: MedicalRecord | null

  /** Receita vinculada (quando existir). */
  transacao?: {
    id: number
    valor: number
    categoria: string
    tipo: string
    status: string
  } | null
}
