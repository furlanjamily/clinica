"use client"

import { useCallback } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { fetchConversations } from "./chat-api"
import {
  isRealtimeEnabled,
  REALTIME_POLL_INTERVAL_MS,
} from "@/lib/chat/realtime-config"
import { CHAT_UNREAD_COUNT_KEY } from "@/lib/chat/cache-keys"
import type { ChatUnreadCountDTO, ConversationDTO } from "@/lib/chat/types"

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

  const updateConversationInCache = useCallback((conversation: ConversationDTO) => {
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
  }, [queryClient])

  const clearConversationUnread = useCallback((conversationId: number) => {
    let cleared = 0

    queryClient.setQueriesData<{ conversations: ConversationDTO[]; categories: string[] }>(
      { queryKey: CHAT_CONVERSATIONS_KEY },
      (prev) => {
        if (!prev) return prev
        const target = prev.conversations.find((c) => c.id === conversationId)
        cleared = target?.unreadCount ?? 0
        if (cleared === 0) return prev
        const conversations = prev.conversations.map((c) =>
          c.id === conversationId ? { ...c, unreadCount: 0 } : c
        )
        return { ...prev, conversations }
      }
    )

    if (cleared > 0) {
      queryClient.setQueryData<ChatUnreadCountDTO>(CHAT_UNREAD_COUNT_KEY, (prev) => ({
        count: Math.max(0, (prev?.count ?? 0) - cleared),
      }))
    }

    queryClient.setQueriesData<ConversationDTO>(
      { queryKey: ["chat", "conversation", conversationId] },
      (prev) => (prev && prev.unreadCount > 0 ? { ...prev, unreadCount: 0 } : prev)
    )
  }, [queryClient])

  const invalidateConversations = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: CHAT_CONVERSATIONS_KEY })
  }, [queryClient])

  return { updateConversationInCache, clearConversationUnread, invalidateConversations }
}
