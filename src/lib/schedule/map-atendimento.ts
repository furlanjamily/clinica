import type { MedicalRecord } from "@/types"
import type { Appointment, AtendimentoPaciente } from "./types"

/** Linha vinda do Prisma (include/select) antes do mapeamento para a UI. */
export type AppointmentRowInput = {
  id: number
  data: string
  horario: string
  status?: string | null
  pacienteId?: number | null
  pacienteNome?: string | null
  profissionalNome?: string | null
  startTime?: string | null
  endTime?: string | null
  accumulatedTime?: number | null
  pausedAt?: string | null
  paciente?: { id: number; nome: string; telefone?: string | null } | null
  prontuario?: unknown | null
  transacao?: {
    id: number
    valor: number
    categoria: string
    tipo: string
    status: string
  } | null
}

function resolvePaciente(row: AppointmentRowInput): AtendimentoPaciente {
  if (row.paciente) return row.paciente
  return {
    id: row.pacienteId ?? 0,
    nome: (row.pacienteNome ?? "").trim() || "Paciente",
  }
}

function normalizeProntuario(row: AppointmentRowInput, prontuario: unknown): MedicalRecord | null {
  if (prontuario == null) return null
  const base = prontuario as MedicalRecord
  return {
    ...base,
    agendamento: base.agendamento ?? {
      data: row.data,
      horario: row.horario,
      profissionalNome: row.profissionalNome ?? undefined,
    },
  }
}

export function toAppointment(row: AppointmentRowInput): Appointment {
  const paciente = resolvePaciente(row)
  const prontuario = normalizeProntuario(row, row.prontuario)

  return {
    id: row.id,
    data: row.data,
    horario: row.horario,
    status: row.status ?? "Agendado",
    paciente,
    pacienteId: row.pacienteId ?? undefined,
    pacienteNome: row.pacienteNome ?? null,
    profissionalNome: row.profissionalNome ?? "",
    startTime: row.startTime ?? undefined,
    endTime: row.endTime ?? undefined,
    accumulatedTime: row.accumulatedTime ?? undefined,
    pausedAt: row.pausedAt ?? undefined,
    prontuario,
    transacao: row.transacao
      ? {
          id: row.transacao.id,
          valor: row.transacao.valor,
          categoria: row.transacao.categoria,
          tipo: row.transacao.tipo,
          status: row.transacao.status,
        }
      : null,
  }
}
