import { getAppointmentsWithReminders } from "@/lib/schedule/service"

export async function getSchedule() {
  return getAppointmentsWithReminders()
}
