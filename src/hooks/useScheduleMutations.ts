"use client"

import { useCallback } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import type { Appointment } from "@/types/types"
import { absoluteUrl } from "@/lib/absolute-url"
import { SCHEDULE_QUERY_KEY } from "@/hooks/useScheduleQuery"
import { invalidateNotificationQueries } from "@/hooks/invalidate-notifications"
import type { CreateAppointmentInput } from "@/lib/validations/schedule"

async function readErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const body = await res.json()
    return body?.message ?? fallback
  } catch {
    return fallback
  }
}

export function useScheduleMutations() {
  const queryClient = useQueryClient()

  const syncCache = useCallback(
    (id: number, updated: Appointment) => {
      queryClient.setQueryData<Appointment[]>(SCHEDULE_QUERY_KEY, (prev) =>
        prev?.map((item) => (item.id === id ? { ...item, ...updated } : item)) ?? []
      )
    },
    [queryClient]
  )

  const patchAppointment = useCallback(
    async (
      id: number,
      changes: Partial<Appointment>,
      errorMsg = "Erro ao atualizar agendamento."
    ): Promise<Appointment | null> => {
      const res = await fetch(absoluteUrl("/api/schedule"), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...changes }),
      })

      if (!res.ok) {
        toast.error(await readErrorMessage(res, errorMsg))
        return null
      }

      const updated: Appointment = await res.json()
      syncCache(id, updated)
      return updated
    },
    [syncCache]
  )

  const createAppointment = useCallback(
    async (data: CreateAppointmentInput): Promise<Appointment | null> => {
      const res = await fetch(absoluteUrl("/api/schedule"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        toast.error(await readErrorMessage(res, "Erro ao salvar agendamento."))
        return null
      }

      const created: Appointment = await res.json()
      queryClient.setQueryData<Appointment[]>(SCHEDULE_QUERY_KEY, (prev) =>
        [...(prev ?? []), created]
      )
      invalidateNotificationQueries(queryClient)
      toast.success("Agendamento salvo!")
      return created
    },
    [queryClient]
  )

  return { patchAppointment, createAppointment, syncCache }
}
