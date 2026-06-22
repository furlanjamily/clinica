import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { resolveAppointmentDoctorFilter } from "@/lib/auth/appointment-scope"
import { getAppointments } from "@/lib/schedule/service"
import ScheduleClient from "./ScheduleClient"

export const dynamic = "force-dynamic"

export default async function Page() {
  const session = await getServerSession(authOptions)
  const doctorFilter = session ? await resolveAppointmentDoctorFilter(session) : undefined
  const data = await getAppointments(doctorFilter)

  return <ScheduleClient initialData={data} />
} 