import { getSchedule } from "@/lib/getSchedule"
import ScheduleClient from "./ScheduleClient"

export const dynamic = "force-dynamic"

export default async function Page() {
  const data = await getSchedule()

  return <ScheduleClient initialData={data} />
} 