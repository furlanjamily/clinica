"use client"

import { useEffect } from "react"
import { useSession } from "next-auth/react"
import { useQueryClient } from "@tanstack/react-query"
import { io } from "socket.io-client"
import { SOCKET_EVENTS } from "@/lib/chat/socket-events"
import { NOTIFICATION_SOCKET_EVENT } from "@/lib/notification/constants"
import { getSocketServerUrl, isRealtimeEnabled } from "@/lib/chat/realtime-config"
import type { ChatMessageDTO } from "@/lib/chat/types"
import { invalidateNotificationQueries } from "./invalidate-notifications"
import { invalidateChatQueries } from "./invalidate-chat"
import { useNotificationUnreadCount } from "./useNotificationUnreadCount"

/** Mantém contador e listas de notificação sincronizados (polling + Socket.IO). */
export function useNotificationSync() {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const enabled = Boolean(session?.user?.id)

  const query = useNotificationUnreadCount(enabled)

  useEffect(() => {
    if (!enabled || !isRealtimeEnabled()) return

    const socket = io(getSocketServerUrl(), {
      path: "/api/socketio",
      withCredentials: true,
      transports: ["websocket", "polling"],
      reconnectionAttempts: 3,
    })

    socket.on(SOCKET_EVENTS.newMessage, (payload: { message: ChatMessageDTO }) => {
      if (payload.message.senderId === session?.user?.id) return
      invalidateNotificationQueries(queryClient)
      invalidateChatQueries(queryClient)
    })

    socket.on(NOTIFICATION_SOCKET_EVENT.CREATED, () => {
      invalidateNotificationQueries(queryClient)
    })

    return () => {
      socket.disconnect()
    }
  }, [enabled, queryClient, session?.user?.id])

  return {
    unreadCount: query.data ?? 0,
    isLoading: query.isLoading,
    isError: query.isError,
  }
}
