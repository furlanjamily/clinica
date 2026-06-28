"use client"

import { useQueryClient, type InfiniteData } from "@tanstack/react-query"
import { NOTIFICATION_TAB } from "@/lib/notification/constants"
import {
  notificationListQueryKey,
  NOTIFICATION_UNREAD_COUNT_KEY,
} from "@/lib/notification/cache-keys"
import type { NotificationDTO, NotificationPageDTO } from "@/lib/notification/dto"

type NotificationListCache = InfiniteData<NotificationPageDTO>

/** Preparado para invalidação via Socket.IO (`notification.created`). */
export function useNotificationCacheUpdater() {
  const queryClient = useQueryClient()

  function prependNotification(notification: NotificationDTO) {
    queryClient.setQueryData<NotificationListCache>(
      notificationListQueryKey(NOTIFICATION_TAB.UNREAD),
      (prev) => {
        const page: NotificationPageDTO = {
          notifications: [notification],
          nextCursor: null,
          hasMore: false,
        }

        if (!prev?.pages?.length) {
          return { pages: [page], pageParams: [undefined] }
        }

        const firstPage = prev.pages[0]
        const pages = [...prev.pages]
        pages[0] = {
          ...firstPage,
          notifications: [notification, ...firstPage.notifications],
        }
        return { ...prev, pages }
      }
    )
  }

  function incrementUnreadCount(by = 1) {
    queryClient.setQueryData<{ count: number }>(NOTIFICATION_UNREAD_COUNT_KEY, (prev) => ({
      count: (prev?.count ?? 0) + by,
    }))
  }

  function handleNotificationCreated(notification: NotificationDTO) {
    prependNotification(notification)
    if (notification.unread) {
      incrementUnreadCount()
    }
  }

  function invalidateNotifications() {
    queryClient.invalidateQueries({ queryKey: notificationListQueryKey(NOTIFICATION_TAB.UNREAD) })
    queryClient.invalidateQueries({ queryKey: notificationListQueryKey(NOTIFICATION_TAB.READ) })
    queryClient.invalidateQueries({ queryKey: notificationListQueryKey(NOTIFICATION_TAB.ARCHIVED) })
    queryClient.invalidateQueries({ queryKey: NOTIFICATION_UNREAD_COUNT_KEY })
  }

  return { prependNotification, incrementUnreadCount, handleNotificationCreated, invalidateNotifications }
}
