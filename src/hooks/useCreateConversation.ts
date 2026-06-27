"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { createConversationApi } from "./chat-api"
import { CHAT_CONVERSATIONS_KEY } from "./useChat"
import type { ConversationDTO } from "@/lib/chat/types"

export function useCreateConversation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (participantIds: string[]) => createConversationApi(participantIds),
    onSuccess: (conversation: ConversationDTO) => {
      queryClient.invalidateQueries({ queryKey: CHAT_CONVERSATIONS_KEY })
      toast.success("Conversa iniciada")
      return conversation
    },
    onError: (err: Error) => {
      toast.error(err.message)
    },
  })
}
