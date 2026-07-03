"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { absoluteUrl } from "@/lib/absolute-url"
import type { AvatarUploadResultDTO } from "@/lib/upload/types"
import { SCHEDULE_QUERY_KEY } from "@/hooks/useScheduleQuery"

async function readErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const body = await res.json()
    return body?.message ?? fallback
  } catch {
    return fallback
  }
}

async function uploadPatientAvatarApi(file: File, patientId: number): Promise<AvatarUploadResultDTO> {
  const formData = new FormData()
  formData.append("file", file)
  formData.append("patientId", String(patientId))

  const res = await fetch(absoluteUrl("/api/patient/avatar"), {
    method: "POST",
    body: formData,
  })

  if (!res.ok) {
    throw new Error(await readErrorMessage(res, "Não foi possível enviar a imagem."))
  }

  return res.json() as Promise<AvatarUploadResultDTO>
}

async function removePatientImageApi(patientId: number): Promise<void> {
  const res = await fetch(absoluteUrl("/api/patient"), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: patientId, image: null }),
  })

  if (!res.ok) {
    throw new Error(await readErrorMessage(res, "Não foi possível remover a imagem."))
  }
}

export function usePatientImageMutation() {
  const queryClient = useQueryClient()

  const uploadMutation = useMutation({
    mutationFn: ({ file, patientId }: { file: File; patientId: number }) =>
      uploadPatientAvatarApi(file, patientId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["crud", "/api/patient"] })
      void queryClient.invalidateQueries({ queryKey: SCHEDULE_QUERY_KEY })
      toast.success("Imagem enviada com sucesso.")
    },
    onError: (error: Error) => {
      toast.error(error.message || "Não foi possível enviar a imagem.")
    },
  })

  const removeMutation = useMutation({
    mutationFn: (patientId: number) => removePatientImageApi(patientId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["crud", "/api/patient"] })
      void queryClient.invalidateQueries({ queryKey: SCHEDULE_QUERY_KEY })
      toast.success("Foto removida.")
    },
    onError: (error: Error) => {
      toast.error(error.message || "Não foi possível remover a imagem.")
    },
  })

  return {
    uploadImage: uploadMutation.mutateAsync,
    removeImage: removeMutation.mutateAsync,
    isUploading: uploadMutation.isPending,
    isRemoving: removeMutation.isPending,
  }
}
