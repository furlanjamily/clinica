"use client"

import { useState } from "react"
import type { Appointment } from "@/types/types"
import Schedule from "./Schedule"

type Props = {
  initialData: Appointment[]
}

export default function ScheduleClient({ initialData }: Props) {
  const [data, setData] = useState<Appointment[]>(initialData)

  return <Schedule data={data} onChangeData={setData} />
}
