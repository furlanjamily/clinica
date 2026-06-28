import type { NotificationTab } from "./constants"

export const NOTIFICATION_ROOT_KEY = ["notification"] as const

export function notificationListQueryKey(tab: NotificationTab) {
  return [...NOTIFICATION_ROOT_KEY, "list", { tab }] as const
}

export const NOTIFICATION_UNREAD_COUNT_KEY = [
  ...NOTIFICATION_ROOT_KEY,
  "unread-count",
] as const
