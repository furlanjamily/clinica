import { getAppointments } from "@/lib/schedule/service"
import ScheduleClient from "./ScheduleClient"

export const dynamic = "force-dynamic"

export default async function Page() {
  const data = await getAppointments()

  return <ScheduleClient initialData={data} />
} 