"use client"

import { useEffect } from "react"
import { useSession } from "next-auth/react"
import { useQueryClient } from "@tanstack/react-query"
import { io } from "socket.io-client"
import { SOCKET_EVENTS } from "@/lib/chat/socket-events"
import {
  getSocketServerUrl,
  isRealtimeEnabled,
} from "@/lib/chat/realtime-config"
import type { ChatMessageDTO, ConversationDTO } from "@/lib/chat/types"
import { invalidateChatQueries } from "./invalidate-chat"
import { useChatUnreadCount } from "./useChatUnreadCount"

/** Mantém contador de mensagens não lidas sincronizado (polling + Socket.IO). */
export function useChatSync() {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const enabled = Boolean(session?.user?.id)

  const query = useChatUnreadCount(enabled)

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
      invalidateChatQueries(queryClient)
    })

    socket.on(
      SOCKET_EVENTS.conversationUpdated,
      (_payload: { conversation: ConversationDTO }) => {
        invalidateChatQueries(queryClient)
      }
    )

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
