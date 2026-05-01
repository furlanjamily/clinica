import type { Appointment } from "./types"

export function toAppointment(a: any) {
  const appointment = {
    id: a.id,
    data: a.data,
    horario: a.horario,
    status: a.status,

    paciente: a.paciente,
    pacienteNome: a.pacienteNome,

    profissionalNome: a.profissionalNome,

    startTime: a.startTime,
    endTime: a.endTime,
    accumulatedTime: a.accumulatedTime,
    pausedAt: a.pausedAt,

    prontuario: a.prontuario ? {
      ...a.prontuario,
      agendamento: a.prontuario.agendamento || {
        data: a.data,
        horario: a.horario,
        profissionalNome: a.profissionalNome,
      }
    } : null,
  }

  return appointment
}