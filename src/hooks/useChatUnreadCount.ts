"use client"

import { useQuery } from "@tanstack/react-query"
import { CHAT_UNREAD_COUNT_KEY } from "@/lib/chat/cache-keys"
import { REALTIME_POLL_INTERVAL_MS } from "@/lib/chat/realtime-config"
import { fetchChatUnreadCount } from "./chat-api"

export function useChatUnreadCount(enabled = true) {
  return useQuery({
    queryKey: CHAT_UNREAD_COUNT_KEY,
    queryFn: fetchChatUnreadCount,
    enabled,
    staleTime: 5_000,
    refetchInterval: enabled ? REALTIME_POLL_INTERVAL_MS : false,
    refetchOnWindowFocus: true,
    select: (data) => data.count,
  })
}
