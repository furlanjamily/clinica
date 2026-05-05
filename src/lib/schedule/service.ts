import { db } from "@/lib/db"
import { toAppointment } from "./map-atendimento"
import type { Appointment } from "./types"

export async function getAppointments(): Promise<Appointment[]> {
  const rows = await db.agendamento.findMany({
    include: {
      paciente: true,
      medico: true,
      prontuario: true,
      transacao: true,
    },
    orderBy: [{ data: "asc" }, { horario: "asc" }],
  })
  return rows.map(toAppointment)
}
