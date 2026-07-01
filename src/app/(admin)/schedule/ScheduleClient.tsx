"use client"

import { useEffect, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import type { Appointment } from "@/types/types"
import { SCHEDULE_QUERY_KEY } from "@/hooks/useScheduleQuery"
import Schedule from "./Schedule"

type Props = {
  initialData: Appointment[]
}

export default function ScheduleClient({ initialData }: Props) {
  const queryClient = useQueryClient()
  const [data, setData] = useState<Appointment[]>(initialData)

  useEffect(() => {
    queryClient.setQueryData(SCHEDULE_QUERY_KEY, initialData)
  }, [initialData, queryClient])

  return <Schedule data={data} onChangeData={setData} />
}
