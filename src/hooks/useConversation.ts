"use client"

import { useQuery } from "@tanstack/react-query"
import { fetchAttachments, fetchConversation } from "./chat-api"
import type { ChatAttachmentDTO } from "@/lib/chat/types"

export function conversationQueryKey(conversationId: number | null) {
  return ["chat", "conversation", conversationId] as const
}

export function attachmentsQueryKey(conversationId: number | null) {
  return ["chat", "attachments", conversationId] as const
}

export function useConversation(conversationId: number | null) {
  return useQuery({
    queryKey: conversationQueryKey(conversationId),
    queryFn: () => fetchConversation(conversationId!),
    enabled: conversationId != null,
  })
}

export function useConversationAttachments(conversationId: number | null) {
  return useQuery<ChatAttachmentDTO[]>({
    queryKey: attachmentsQueryKey(conversationId),
    queryFn: () => fetchAttachments(conversationId!),
    enabled: conversationId != null,
    staleTime: 30_000,
  })
}
