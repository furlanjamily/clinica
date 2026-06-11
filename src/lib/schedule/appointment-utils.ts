import type { Appointment } from "./types"

export function getPatientName(item: Appointment): string {
  return item.patient?.name ?? item.patientName ?? "Sem paciente"
}

/**
 * Tempo decorrido do atendimento em ms, somando o tempo acumulado
 * com o intervalo desde o último início (quando não está pausado).
 */
export function calcElapsedMs(item: Appointment): number {
  const accumulated = item.accumulatedTime ?? 0
  if (item.pausedAt) return accumulated
  if (!item.startTime) return accumulated
  return accumulated + (Date.now() - new Date(item.startTime).getTime())
}
