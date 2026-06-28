"use client"

import { useMemo } from "react"
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query"
import { toast } from "sonner"
import { REALTIME_POLL_INTERVAL_MS } from "@/lib/chat/realtime-config"
import {
  NOTIFICATION_TAB,
  type NotificationTab,
} from "@/lib/notification/constants"
import {
  notificationListQueryKey,
  NOTIFICATION_UNREAD_COUNT_KEY,
} from "@/lib/notification/cache-keys"
import type { NotificationDTO, NotificationPageDTO } from "@/lib/notification/dto"
import { groupNotificationsByDay } from "@/lib/notification/group-by-day"
import {
  archiveNotificationsApi,
  fetchNotifications,
  markAllNotificationsReadApi,
  markNotificationsReadApi,
} from "./notification-api"

type NotificationListCache = InfiniteData<NotificationPageDTO>

function flattenNotifications(
  pages: NotificationPageDTO[] | undefined
): NotificationDTO[] {
  if (!pages) return []
  return pages.flatMap((page) => page.notifications)
}

function patchNotificationPages(
  pages: NotificationPageDTO[],
  notificationIds: string[],
  patch: (item: NotificationDTO) => NotificationDTO | null
): NotificationPageDTO[] {
  const idSet = new Set(notificationIds)

  return pages.map((page) => ({
    ...page,
    notifications: page.notifications
      .map((item) => (idSet.has(item.id) ? patch(item) : item))
      .filter((item): item is NotificationDTO => item != null),
  }))
}

export function useNotifications(activeTab: NotificationTab, enabled = true) {
  const queryClient = useQueryClient()

  const query = useInfiniteQuery({
    queryKey: notificationListQueryKey(activeTab),
    queryFn: ({ pageParam }) =>
      fetchNotifications(activeTab, pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled,
    staleTime: 5_000,
    refetchInterval: enabled ? REALTIME_POLL_INTERVAL_MS : false,
    refetchOnMount: enabled ? "always" : false,
    refetchOnWindowFocus: true,
  })

  const notifications = useMemo(
    () => flattenNotifications(query.data?.pages),
    [query.data?.pages]
  )

  const groupedNotifications = useMemo(
    () => groupNotificationsByDay(notifications),
    [notifications]
  )

  const markAsReadMutation = useMutation({
    mutationFn: (notificationIds: string[]) => markNotificationsReadApi(notificationIds),
    onMutate: async (notificationIds) => {
      await queryClient.cancelQueries({ queryKey: notificationListQueryKey(activeTab) })
      await queryClient.cancelQueries({ queryKey: NOTIFICATION_UNREAD_COUNT_KEY })

      const previousList = queryClient.getQueryData<NotificationListCache>(
        notificationListQueryKey(activeTab)
      )
      const previousCount = queryClient.getQueryData<{ count: number }>(
        NOTIFICATION_UNREAD_COUNT_KEY
      )

      queryClient.setQueryData<NotificationListCache>(
        notificationListQueryKey(NOTIFICATION_TAB.UNREAD),
        (prev) => {
          if (!prev) return prev
          return {
            ...prev,
            pages: patchNotificationPages(prev.pages, notificationIds, () => null),
          }
        }
      )

      queryClient.setQueryData<{ count: number }>(NOTIFICATION_UNREAD_COUNT_KEY, (prev) => {
        if (!prev) return prev
        const next = Math.max(0, prev.count - notificationIds.length)
        return { count: next }
      })

      if (activeTab === NOTIFICATION_TAB.READ) {
        queryClient.setQueryData<NotificationListCache>(
          notificationListQueryKey(NOTIFICATION_TAB.READ),
          (prev) => {
            if (!prev) return prev
            return {
              ...prev,
              pages: patchNotificationPages(prev.pages, notificationIds, (item) => ({
                ...item,
                unread: false,
              })),
            }
          }
        )
      }

      return { previousList, previousCount, activeTab }
    },
    onError: (_error, _ids, context) => {
      if (context?.previousList) {
        queryClient.setQueryData(
          notificationListQueryKey(context.activeTab),
          context.previousList
        )
      }
      if (context?.previousCount) {
        queryClient.setQueryData(NOTIFICATION_UNREAD_COUNT_KEY, context.previousCount)
      }
      toast.error("Erro ao marcar notificação como lida")
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: notificationListQueryKey(NOTIFICATION_TAB.UNREAD) })
      queryClient.invalidateQueries({ queryKey: notificationListQueryKey(NOTIFICATION_TAB.READ) })
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_UNREAD_COUNT_KEY })
    },
  })

  const markAllAsReadMutation = useMutation({
    mutationFn: () => markAllNotificationsReadApi(),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: notificationListQueryKey(activeTab) })
      await queryClient.cancelQueries({ queryKey: NOTIFICATION_UNREAD_COUNT_KEY })

      const previousUnread = queryClient.getQueryData<NotificationListCache>(
        notificationListQueryKey(NOTIFICATION_TAB.UNREAD)
      )
      const previousCount = queryClient.getQueryData<{ count: number }>(
        NOTIFICATION_UNREAD_COUNT_KEY
      )

      queryClient.setQueryData<NotificationListCache>(
        notificationListQueryKey(NOTIFICATION_TAB.UNREAD),
        (prev) => {
          if (!prev) return prev
          return { ...prev, pages: [{ notifications: [], nextCursor: null, hasMore: false }] }
        }
      )

      queryClient.setQueryData<{ count: number }>(NOTIFICATION_UNREAD_COUNT_KEY, { count: 0 })

      return { previousUnread, previousCount, activeTab }
    },
    onError: (_error, _vars, context) => {
      if (context?.previousUnread) {
        queryClient.setQueryData(
          notificationListQueryKey(NOTIFICATION_TAB.UNREAD),
          context.previousUnread
        )
      }
      if (context?.previousCount) {
        queryClient.setQueryData(NOTIFICATION_UNREAD_COUNT_KEY, context.previousCount)
      }
      toast.error("Erro ao marcar todas como lidas")
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: notificationListQueryKey(NOTIFICATION_TAB.UNREAD) })
      queryClient.invalidateQueries({ queryKey: notificationListQueryKey(NOTIFICATION_TAB.READ) })
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_UNREAD_COUNT_KEY })
    },
  })

  const archiveMutation = useMutation({
    mutationFn: (notificationIds: string[]) => archiveNotificationsApi(notificationIds),
    onMutate: async (notificationIds) => {
      await queryClient.cancelQueries({ queryKey: notificationListQueryKey(activeTab) })

      const previousList = queryClient.getQueryData<NotificationListCache>(
        notificationListQueryKey(activeTab)
      )
      const previousCount = queryClient.getQueryData<{ count: number }>(
        NOTIFICATION_UNREAD_COUNT_KEY
      )

      const unreadArchived = notifications.filter(
        (item) => notificationIds.includes(item.id) && item.unread
      ).length

      queryClient.setQueryData<NotificationListCache>(
        notificationListQueryKey(activeTab),
        (prev) => {
          if (!prev) return prev
          return {
            ...prev,
            pages: patchNotificationPages(prev.pages, notificationIds, () => null),
          }
        }
      )

      if (unreadArchived > 0) {
        queryClient.setQueryData<{ count: number }>(NOTIFICATION_UNREAD_COUNT_KEY, (prev) => {
          if (!prev) return prev
          return { count: Math.max(0, prev.count - unreadArchived) }
        })
      }

      return { previousList, previousCount, activeTab, unreadArchived }
    },
    onError: (_error, _ids, context) => {
      if (context?.previousList) {
        queryClient.setQueryData(
          notificationListQueryKey(context.activeTab),
          context.previousList
        )
      }
      if (context?.previousCount) {
        queryClient.setQueryData(NOTIFICATION_UNREAD_COUNT_KEY, context.previousCount)
      }
      toast.error("Erro ao arquivar notificação")
    },
    onSettled: (_data, _error, _ids, context) => {
      queryClient.invalidateQueries({ queryKey: notificationListQueryKey(context?.activeTab ?? activeTab) })
      queryClient.invalidateQueries({ queryKey: notificationListQueryKey(NOTIFICATION_TAB.ARCHIVED) })
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_UNREAD_COUNT_KEY })
    },
  })

  return {
    ...query,
    notifications,
    groupedNotifications,
    markAsRead: markAsReadMutation.mutate,
    markAsReadAsync: markAsReadMutation.mutateAsync,
    markAllAsRead: markAllAsReadMutation.mutate,
    archive: archiveMutation.mutate,
    isMarkingRead: markAsReadMutation.isPending,
    isMarkingAllRead: markAllAsReadMutation.isPending,
  }
}
