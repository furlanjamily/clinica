"use client"

import { useQuery } from "@tanstack/react-query"
import { REALTIME_POLL_INTERVAL_MS } from "@/lib/chat/realtime-config"
import { NOTIFICATION_UNREAD_COUNT_KEY } from "@/lib/notification/cache-keys"
import { fetchUnreadCount } from "./notification-api"

export function useNotificationUnreadCount(enabled = true) {
  return useQuery({
    queryKey: NOTIFICATION_UNREAD_COUNT_KEY,
    queryFn: fetchUnreadCount,
    enabled,
    staleTime: 5_000,
    refetchInterval: enabled ? REALTIME_POLL_INTERVAL_MS : false,
    refetchOnWindowFocus: true,
    select: (data) => data.count,
  })
}
