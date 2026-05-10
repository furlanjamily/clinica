import { db } from "@/lib/db"

export async function findAppointmentConflict(
  doctorId: number,
  date: string,
  slotTime: string,
  excludeId?: number
) {
  return db.appointment.findFirst({
    where: {
      doctorId,
      date,
      slotTime,
      status: { notIn: ["Cancelado", "Concluido"] },
      ...(excludeId != null ? { id: { not: excludeId } } : {}),
    },
  })
}
