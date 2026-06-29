"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { getSession, useSession } from "next-auth/react"
import { toast } from "sonner"
import { absoluteUrl } from "@/lib/absolute-url"
import type { AvatarUploadResultDTO } from "@/lib/upload/types"
import { USERS_QUERY_KEY, type UserRow } from "@/hooks/useUsers"

async function readErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const body = await res.json()
    return body?.message ?? fallback
  } catch {
    return fallback
  }
}

async function uploadUserAvatarApi(file: File, userId: string): Promise<AvatarUploadResultDTO> {
  const formData = new FormData()
  formData.append("file", file)
  formData.append("userId", userId)

  const res = await fetch(absoluteUrl("/api/user/avatar"), {
    method: "POST",
    body: formData,
  })

  if (!res.ok) {
    throw new Error(await readErrorMessage(res, "Não foi possível enviar a imagem."))
  }

  return res.json() as Promise<AvatarUploadResultDTO>
}

async function removeUserImageApi(userId: string): Promise<void> {
  const res = await fetch(absoluteUrl("/api/user"), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: userId, image: null }),
  })

  if (!res.ok) {
    throw new Error(await readErrorMessage(res, "Não foi possível remover a imagem."))
  }
}

async function syncSessionForUser(userId: string, updateSession: (data?: unknown) => Promise<unknown>) {
  const current = await getSession()
  if (current?.user?.id !== userId) return
  await updateSession({})
}

export function useUserImageMutation() {
  const queryClient = useQueryClient()
  const { update: updateSession } = useSession()

  const uploadMutation = useMutation({
    mutationFn: ({ file, userId }: { file: File; userId: string }) =>
      uploadUserAvatarApi(file, userId),
    onSuccess: async (data, variables) => {
      queryClient.setQueryData<UserRow[]>(USERS_QUERY_KEY, (prev) =>
        (prev ?? []).map((user) =>
          user.id === variables.userId ? { ...user, image: data.image } : user
        )
      )
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] })
      await syncSessionForUser(variables.userId, updateSession)
      toast.success("Imagem enviada com sucesso.")
    },
    onError: (error: Error) => {
      toast.error(error.message || "Não foi possível enviar a imagem.")
    },
  })

  const removeMutation = useMutation({
    mutationFn: (userId: string) => removeUserImageApi(userId),
    onSuccess: async (_data, userId) => {
      queryClient.setQueryData<UserRow[]>(USERS_QUERY_KEY, (prev) =>
        (prev ?? []).map((user) => (user.id === userId ? { ...user, image: null } : user))
      )
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] })
      await syncSessionForUser(userId, updateSession)
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
