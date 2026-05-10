import type { MedicalRecord } from "@/types"
import type { Appointment, AtendimentoPaciente } from "./types"

/** Relação `medico` no Prisma (select) ou nome já denormalizado. */
export type MedicoInput = string | { id: number; nome: string } | null | undefined

/** Linha vinda do Prisma (include/select) antes do mapeamento para a UI. */
export type AppointmentRowInput = {
  id: number
  data: string
  horario: string
  status?: string | null
  pacienteId?: number | null
  pacienteNome?: string | null
  medico: MedicoInput
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

function resolveProfissionalNome(medico: MedicoInput): string {
  if (medico == null) return ""
  if (typeof medico === "string") return medico
  return medico.nome ?? ""
}

function normalizeProntuario(row: AppointmentRowInput, prontuario: unknown): MedicalRecord | null {
  if (prontuario == null) return null
  const base = prontuario as MedicalRecord
  const profissionalNome = resolveProfissionalNome(row.medico)
  return {
    ...base,
    agendamento: base.agendamento ?? {
      data: row.data,
      horario: row.horario,
      profissionalNome,
    },
  }
}

export function toAppointment(row: AppointmentRowInput): Appointment {
  const paciente = resolvePaciente(row)
  const prontuario = normalizeProntuario(row, row.prontuario)
  const profissionalNome = resolveProfissionalNome(row.medico)

  return {
    id: row.id,
    data: row.data,
    horario: row.horario,
    status: row.status ?? "Agendado",
    paciente,
    pacienteId: row.pacienteId ?? undefined,
    pacienteNome: row.pacienteNome ?? null,
    profissionalNome,
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
