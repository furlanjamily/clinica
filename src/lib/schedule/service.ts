import { db } from "@/lib/db"
import { toAppointment } from "./map-appointment"
import type { Appointment } from "./types"

export async function getAppointments(): Promise<Appointment[]> {
  const rows = await db.appointment.findMany({
    include: {
      patient: true,
      doctor: true,
      clinicalChart: true,
      transaction: true,
    },
    orderBy: [{ date: "asc" }, { slotTime: "asc" }],
  })
  return rows.map(toAppointment)
}
