"use client"

import { useInfiniteQuery } from "@tanstack/react-query"
import { fetchMessages } from "./chat-api"
import {
  isRealtimeEnabled,
  REALTIME_POLL_INTERVAL_MS,
} from "@/lib/chat/realtime-config"
import type { ChatMessageDTO } from "@/lib/chat/types"

export function messagesQueryKey(conversationId: number | null, search?: string) {
  return ["chat", "messages", conversationId, { search: search ?? "" }] as const
}

export function useMessages(conversationId: number | null, search?: string) {
  return useInfiniteQuery({
    queryKey: messagesQueryKey(conversationId, search),
    queryFn: ({ pageParam }) =>
      fetchMessages(conversationId!, pageParam as number | undefined, search),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? (lastPage.nextCursor ?? undefined) : undefined,
    enabled: conversationId != null,
    staleTime: 10_000,
    refetchInterval: isRealtimeEnabled() ? false : REALTIME_POLL_INTERVAL_MS,
  })
}

export function flattenMessages(
  pages: Array<{ messages: ChatMessageDTO[] }> | undefined
): ChatMessageDTO[] {
  if (!pages) return []
  return pages.flatMap((p) => p.messages)
}
