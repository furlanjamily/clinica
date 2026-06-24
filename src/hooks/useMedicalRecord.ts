"use client"

import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import type { MedicalRecord } from "@/types"
import { absoluteUrl } from "@/lib/absolute-url"
import { SCHEDULE_QUERY_KEY } from "@/hooks/useScheduleQuery"
import type { Appointment } from "@/types/types"

export const MEDICAL_RECORDS_QUERY_KEY = ["medical-records"] as const

async function readErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const body = await res.json()
    return body?.message ?? fallback
  } catch {
    return fallback
  }
}

export async function fetchMedicalRecords(): Promise<MedicalRecord[]> {
  const res = await fetch(absoluteUrl("/api/medical-record"))
  if (!res.ok) throw new Error("Erro ao buscar prontuários")
  const payload: unknown = await res.json()
  return Array.isArray(payload) ? (payload as MedicalRecord[]) : []
}

export function useMedicalRecords() {
  return useSuspenseQuery<MedicalRecord[]>({
    queryKey: MEDICAL_RECORDS_QUERY_KEY,
    queryFn: fetchMedicalRecords,
  })
}

type SaveMedicalRecordInput = Partial<MedicalRecord> & { appointmentId: number }

type SaveOptions = {
  editingId?: number
  syncSchedule?: boolean
}

export function useMedicalRecordMutations() {
  const queryClient = useQueryClient()

  function setRecords(updater: (prev: MedicalRecord[]) => MedicalRecord[]) {
    queryClient.setQueryData<MedicalRecord[]>(MEDICAL_RECORDS_QUERY_KEY, (prev) =>
      updater(prev ?? [])
    )
  }

  async function saveRecord(
    data: SaveMedicalRecordInput,
    options: SaveOptions = {}
  ): Promise<MedicalRecord | null> {
    const { editingId, syncSchedule = false } = options
    const method = editingId ? "PATCH" : "POST"
    const body = editingId ? { ...data, id: editingId } : data

    const res = await fetch(absoluteUrl("/api/medical-record"), {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      toast.error(await readErrorMessage(res, "Erro ao salvar prontuário."))
      return null
    }

    const saved: MedicalRecord = await res.json()

    if (syncSchedule) {
      queryClient.setQueryData<Appointment[]>(SCHEDULE_QUERY_KEY, (prev) =>
        prev?.map((item) =>
          item.id === data.appointmentId ? { ...item, clinicalChart: saved } : item
        ) ?? []
      )
    } else {
      if (editingId) {
        setRecords((prev) => prev.map((r) => (r.id === saved.id ? saved : r)))
      } else {
        setRecords((prev) => [saved, ...prev])
      }
    }

    return saved
  }

  async function removeRecord(id: number): Promise<boolean> {
    const res = await fetch(absoluteUrl("/api/medical-record"), {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    })

    if (!res.ok) {
      toast.error(await readErrorMessage(res, "Erro ao apagar prontuário."))
      return false
    }

    setRecords((prev) => prev.filter((r) => r.id !== id))
    toast.success("Prontuário apagado.")
    return true
  }

  return { saveRecord, removeRecord }
}
