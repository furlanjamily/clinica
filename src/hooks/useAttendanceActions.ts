"use client"

import { useCallback } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import type { Appointment } from "@/types/types"
import { SCHEDULE_QUERY_KEY } from "@/hooks/useScheduleQuery"
import { calcElapsedMs } from "@/lib/schedule/appointment-utils"
import { AppointmentStatus } from "@/lib/schedule/status"

/**
 * Ações do atendimento em andamento (pausar, retomar, recomeçar, finalizar).
 * Atualiza o cache do React Query de forma otimista e refaz a busca em caso
 * de falha no servidor.
 */
export function useAttendanceActions() {
  const queryClient = useQueryClient()

  const setAppointment = useCallback(
    (id: number, changes: Partial<Appointment>) => {
      queryClient.setQueryData<Appointment[]>(SCHEDULE_QUERY_KEY, (prev) =>
        prev?.map((item) => (item.id === id ? { ...item, ...changes } : item)) ?? []
      )
    },
    [queryClient]
  )

  const updateItem = useCallback(
    async (id: number, changes: Partial<Appointment>, errorMsg = "Erro ao atualizar atendimento. Tente novamente.") => {
      setAppointment(id, changes)

      try {
        const res = await fetch("/api/schedule", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, ...changes }),
        })
        if (!res.ok) throw new Error(errorMsg)
        return true
      } catch {
        toast.error(errorMsg)
        queryClient.invalidateQueries({ queryKey: SCHEDULE_QUERY_KEY })
        return false
      }
    },
    [queryClient, setAppointment]
  )

  const finalize = useCallback(
    async (item: Appointment) => {
      if (!item.clinicalChart) {
        toast.error("Preencha o prontuário antes de finalizar.")
        return
      }

      const ok = await updateItem(
        item.id,
        {
          status: AppointmentStatus.Completed,
          endTime: new Date().toISOString(),
          accumulatedTime: calcElapsedMs(item),
        },
        "Erro ao finalizar atendimento. Tente novamente."
      )

      if (ok) toast.success("Atendimento finalizado!")
    },
    [updateItem]
  )

  const pause = useCallback(
    (item: Appointment) => {
      updateItem(item.id, {
        pausedAt: new Date().toISOString(),
        accumulatedTime: calcElapsedMs(item),
      })
    },
    [updateItem]
  )

  const resume = useCallback(
    (item: Appointment) => {
      updateItem(item.id, { pausedAt: null, startTime: new Date().toISOString() })
    },
    [updateItem]
  )

  const restart = useCallback(
    (item: Appointment) => {
      updateItem(item.id, {
        pausedAt: null,
        startTime: new Date().toISOString(),
        accumulatedTime: 0,
      })
    },
    [updateItem]
  )

  return { setAppointment, updateItem, finalize, pause, resume, restart }
}
