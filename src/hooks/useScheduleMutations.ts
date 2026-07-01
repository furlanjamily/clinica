"use client"

import { useCallback } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import type { Appointment } from "@/types/types"
import { absoluteUrl } from "@/lib/absolute-url"
import { SCHEDULE_QUERY_KEY } from "@/hooks/useScheduleQuery"
import { invalidateNotificationQueries } from "@/hooks/invalidate-notifications"
import type { CreateAppointmentInput, UpdateAppointmentInput } from "@/lib/validations/schedule"

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

  const invalidateScheduleQueries = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: SCHEDULE_QUERY_KEY })
    queryClient.invalidateQueries({ queryKey: ["dashboard", "overview"] })
  }, [queryClient])

  const syncCache = useCallback(
    (id: number, updated: Appointment) => {
      queryClient.setQueryData<Appointment[]>(SCHEDULE_QUERY_KEY, (prev) => {
        if (!prev?.length) return [updated]

        const exists = prev.some((item) => item.id === id)
        if (!exists) return [...prev, updated]

        return prev.map((item) => (item.id === id ? { ...item, ...updated } : item))
      })
    },
    [queryClient]
  )

  const patchAppointment = useCallback(
    async (
      id: number,
      changes: Omit<UpdateAppointmentInput, "id">,
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
      invalidateScheduleQueries()
      return updated
    },
    [syncCache, invalidateScheduleQueries]
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
      invalidateScheduleQueries()
      invalidateNotificationQueries(queryClient)
      toast.success("Agendamento salvo!")
      return created
    },
    [queryClient, invalidateScheduleQueries]
  )

  return { patchAppointment, createAppointment, syncCache }
}
