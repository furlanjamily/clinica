"use client"

import type { QueryClient } from "@tanstack/react-query"
import { CHAT_UNREAD_COUNT_KEY, CHAT_ROOT_KEY } from "@/lib/chat/cache-keys"

export function invalidateChatQueries(queryClient: QueryClient): void {
  void queryClient.invalidateQueries({ queryKey: CHAT_UNREAD_COUNT_KEY })
  void queryClient.invalidateQueries({ queryKey: CHAT_ROOT_KEY })
}
