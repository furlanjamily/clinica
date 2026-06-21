import { db } from "@/lib/db"
import { AppointmentStatus } from "@/lib/schedule/status"
import { combineLocalDateTime } from "@/lib/datetime/appointment-time"

export async function findAppointmentConflict(
  doctorId: number,
  date: string,
  slotTime: string,
  excludeId?: number
) {
  return db.appointment.findFirst({
    where: {
      doctorId,
      scheduledStart: combineLocalDateTime(date, slotTime),
      status: { notIn: [AppointmentStatus.Cancelled, AppointmentStatus.Completed] },
      ...(excludeId != null ? { id: { not: excludeId } } : {}),
    },
  })
}
