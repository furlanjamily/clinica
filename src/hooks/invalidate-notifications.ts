"use client"

import type { QueryClient } from "@tanstack/react-query"
import {
  NOTIFICATION_ROOT_KEY,
  NOTIFICATION_UNREAD_COUNT_KEY,
} from "@/lib/notification/cache-keys"

export function invalidateNotificationQueries(queryClient: QueryClient): void {
  void queryClient.invalidateQueries({ queryKey: NOTIFICATION_UNREAD_COUNT_KEY })
  void queryClient.invalidateQueries({ queryKey: NOTIFICATION_ROOT_KEY })
}
