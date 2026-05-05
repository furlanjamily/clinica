import { getAppointments } from "@/lib/schedule/service"

export async function getSchedule() {
  return getAppointments()
}
