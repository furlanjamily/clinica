"use client"

import { useState } from "react"
import type { Atendimento } from "@/types/types"
import Schedule from "./Schedule"

type Props = {
  initialData: Atendimento[]
}

export default function ScheduleClient({ initialData }: Props) {
  const [data, setData] = useState<Atendimento[]>(initialData)

  return <Schedule data={data} onChangeData={setData} />
}
