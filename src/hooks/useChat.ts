"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { fetchConversations } from "./chat-api"
import {
  isRealtimeEnabled,
  REALTIME_POLL_INTERVAL_MS,
} from "@/lib/chat/realtime-config"
import type { ConversationDTO } from "@/lib/chat/types"

export const CHAT_CONVERSATIONS_KEY = ["chat", "conversations"] as const

export function conversationsQueryKey(search?: string, archived?: boolean) {
  return ["chat", "conversations", { search: search ?? "", archived: archived ?? false }] as const
}

export function useChat(search?: string, archived = false) {
  return useQuery({
    queryKey: conversationsQueryKey(search, archived),
    queryFn: () => fetchConversations(search, archived),
    staleTime: 15_000,
    refetchInterval: isRealtimeEnabled() ? false : REALTIME_POLL_INTERVAL_MS,
  })
}

export function useChatCacheUpdater() {
  const queryClient = useQueryClient()

  function updateConversationInCache(conversation: ConversationDTO) {
    queryClient.setQueriesData<{ conversations: ConversationDTO[]; categories: string[] }>(
      { queryKey: CHAT_CONVERSATIONS_KEY },
      (prev) => {
        if (!prev) return prev
        const exists = prev.conversations.some((c) => c.id === conversation.id)
        const conversations = exists
          ? prev.conversations.map((c) =>
              c.id === conversation.id ? conversation : c
            )
          : [conversation, ...prev.conversations]
        conversations.sort(
          (a, b) =>
            new Date(b.lastMessageAt ?? b.createdAt).getTime() -
            new Date(a.lastMessageAt ?? a.createdAt).getTime()
        )
        return { ...prev, conversations }
      }
    )
  }

  function invalidateConversations() {
    queryClient.invalidateQueries({ queryKey: CHAT_CONVERSATIONS_KEY })
  }

  return { updateConversationInCache, invalidateConversations }
}
