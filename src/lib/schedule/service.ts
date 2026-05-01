import { db } from "@/lib/db"
import { toAppointment } from "./map-atendimento"
import { runWhatsAppReminders } from "./reminders"
import type { Appointment } from "./types"

export async function getAppointmentsWithReminders(): Promise<Appointment[]> {
  const rows = await db.agendamento.findMany({
    include: {
      paciente: true,
      medico: true,
      prontuario: true,
    },
    orderBy: [{ data: "asc" }, { horario: "asc" }],
  })
  await runWhatsAppReminders(rows)
  return rows.map(toAppointment)
}
