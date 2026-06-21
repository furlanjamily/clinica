import { db } from "@/lib/db"
import { toAppointment } from "./map-appointment"
import type { Appointment } from "./types"

export async function getAppointments(): Promise<Appointment[]> {
  const rows = await db.appointment.findMany({
    include: {
      patient: true,
      doctor: true,
      medicalRecord: { include: { patient: true } },
      transaction: true,
    },
    orderBy: { scheduledStart: "asc" },
  })
  return rows.map(toAppointment)
}
