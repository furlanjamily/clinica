"use client"

import { useCallback } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  deleteMessageApi,
  markReadApi,
  patchMessage,
  postMessage,
  readErrorMessage,
  uploadChatFile,
} from "./chat-api"
import { messagesQueryKey } from "./useMessages"
import { attachmentsQueryKey } from "./useConversation"
import type { ChatMessageDTO, UploadResultDTO } from "@/lib/chat/types"

export function useSendMessage(conversationId: number | null) {
  const queryClient = useQueryClient()

  const appendMessage = useCallback(
    (message: ChatMessageDTO) => {
      if (!conversationId) return
      queryClient.setQueryData(
        messagesQueryKey(conversationId),
        (prev: { pages: Array<{ messages: ChatMessageDTO[] }>; pageParams: unknown[] } | undefined) => {
          if (!prev?.pages?.length) return prev
          const lastIdx = prev.pages.length - 1
          const pages = [...prev.pages]
          pages[lastIdx] = {
            ...pages[lastIdx],
            messages: [...pages[lastIdx].messages, message],
          }
          return { ...prev, pages }
        }
      )
    },
    [conversationId, queryClient]
  )

  const sendMessage = useCallback(
    async (content: string, replyToId?: number, files?: File[]) => {
      if (!conversationId) return null

      let attachments: UploadResultDTO[] | undefined
      if (files?.length) {
        try {
          attachments = await Promise.all(files.map((f) => uploadChatFile(f)))
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Erro no upload")
          return null
        }
      }

      try {
        const message = await postMessage({
          conversationId,
          content: content.trim() || undefined,
          replyToId,
          attachments,
        })
        appendMessage(message)
        queryClient.invalidateQueries({ queryKey: attachmentsQueryKey(conversationId) })
        return message
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Erro ao enviar")
        return null
      }
    },
    [appendMessage, conversationId, queryClient]
  )

  const editMessage = useCallback(
    async (messageId: number, content: string) => {
      try {
        const updated = await patchMessage(messageId, content)
        if (!conversationId) return null
        queryClient.setQueryData(
          messagesQueryKey(conversationId),
          (prev: { pages: Array<{ messages: ChatMessageDTO[] }> } | undefined) => {
            if (!prev) return prev
            return {
              ...prev,
              pages: prev.pages.map((page) => ({
                ...page,
                messages: page.messages.map((m) =>
                  m.id === messageId ? updated : m
                ),
              })),
            }
          }
        )
        return updated
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Erro ao editar")
        return null
      }
    },
    [conversationId, queryClient]
  )

  const removeMessage = useCallback(
    async (messageId: number) => {
      try {
        await deleteMessageApi(messageId)
        if (!conversationId) return false
        queryClient.setQueryData(
          messagesQueryKey(conversationId),
          (prev: { pages: Array<{ messages: ChatMessageDTO[] }> } | undefined) => {
            if (!prev) return prev
            return {
              ...prev,
              pages: prev.pages.map((page) => ({
                ...page,
                messages: page.messages.map((m) =>
                  m.id === messageId
                    ? { ...m, isDeleted: true, content: null }
                    : m
                ),
              })),
            }
          }
        )
        return true
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Erro ao excluir")
        return false
      }
    },
    [conversationId, queryClient]
  )

  return { sendMessage, editMessage, removeMessage, appendMessage }
}

export function useMessageRead(conversationId: number | null) {
  const markAsRead = useCallback(async (messageIds?: number[]) => {
    if (!conversationId) return
    try {
      await markReadApi(conversationId, messageIds)
    } catch {
      // silencioso — leitura é best-effort
    }
  }, [conversationId])

  return { markAsRead }
}

export async function handleSendError(res: Response) {
  toast.error(await readErrorMessage(res, "Erro na operação"))
}
