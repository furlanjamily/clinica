"use client"

import { useQuery } from "@tanstack/react-query"
import { fetchChatUsers } from "./chat-api"

export const CHAT_USERS_QUERY_KEY = ["chat", "users"] as const

export function useChatUsers() {
  return useQuery({
    queryKey: CHAT_USERS_QUERY_KEY,
    queryFn: fetchChatUsers,
    staleTime: 60_000,
  })
}
