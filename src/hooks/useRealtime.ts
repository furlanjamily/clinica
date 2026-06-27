"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useQueryClient } from "@tanstack/react-query"
import { io, type Socket } from "socket.io-client"
import { SOCKET_EVENTS } from "@/lib/chat/socket-events"
import { messagesQueryKey } from "./useMessages"
import { useChatCacheUpdater } from "./useChat"
import { deliverMessageApi } from "./chat-api"
import type { ChatMessageDTO, ConversationDTO } from "@/lib/chat/types"

type TypingState = {
  userId: string
  name: string | null
}

export function useRealtime(activeConversationId: number | null) {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const { updateConversationInCache } = useChatCacheUpdater()
  const socketRef = useRef<Socket | null>(null)
  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([])
  const [typingUsers, setTypingUsers] = useState<TypingState[]>([])

  const upsertMessage = useCallback(
    (conversationId: number, message: ChatMessageDTO, mode: "new" | "edit") => {
      queryClient.setQueryData(
        messagesQueryKey(conversationId),
        (prev: { pages: Array<{ messages: ChatMessageDTO[] }>; pageParams: unknown[] } | undefined) => {
          if (!prev?.pages?.length) return prev
          const pages = prev.pages.map((page, idx) => {
            if (idx !== prev.pages.length - 1) return page
            if (mode === "edit") {
              return {
                ...page,
                messages: page.messages.map((m) =>
                  m.id === message.id ? message : m
                ),
              }
            }
            if (page.messages.some((m) => m.id === message.id)) return page
            return { ...page, messages: [...page.messages, message] }
          })
          return { ...prev, pages }
        }
      )
    },
    [queryClient]
  )

  useEffect(() => {
    if (!session?.user?.id) return

    const socket = io({
      path: "/api/socketio",
      withCredentials: true,
      transports: ["websocket", "polling"],
    })

    socketRef.current = socket

    socket.on(SOCKET_EVENTS.onlineUsers, (payload: { userIds: string[] }) => {
      setOnlineUserIds(payload.userIds ?? [])
    })

    socket.on(SOCKET_EVENTS.newMessage, (payload: { message: ChatMessageDTO }) => {
      const msg = payload.message
      upsertMessage(msg.conversationId, msg, "new")

      if (
        msg.conversationId === activeConversationId &&
        msg.senderId !== session.user.id
      ) {
        void deliverMessageApi(msg.id)
      }
    })

    socket.on(SOCKET_EVENTS.messageEdited, (payload: { message: ChatMessageDTO }) => {
      upsertMessage(payload.message.conversationId, payload.message, "edit")
    })

    socket.on(SOCKET_EVENTS.messageDeleted, (payload: { messageId: number; conversationId: number }) => {
      queryClient.setQueryData(
        messagesQueryKey(payload.conversationId),
        (prev: { pages: Array<{ messages: ChatMessageDTO[] }> } | undefined) => {
          if (!prev) return prev
          return {
            ...prev,
            pages: prev.pages.map((page) => ({
              ...page,
              messages: page.messages.map((m) =>
                m.id === payload.messageId
                  ? { ...m, isDeleted: true, content: null }
                  : m
              ),
            })),
          }
        }
      )
    })

    socket.on(
      SOCKET_EVENTS.conversationUpdated,
      (payload: { conversation: ConversationDTO }) => {
        updateConversationInCache(payload.conversation)
      }
    )

    socket.on(
      SOCKET_EVENTS.typingStart,
      (payload: { conversationId: number; user: TypingState }) => {
        if (payload.conversationId !== activeConversationId) return
        if (payload.user.userId === session.user.id) return
        setTypingUsers((prev) => {
          if (prev.some((u) => u.userId === payload.user.userId)) return prev
          return [...prev, payload.user]
        })
      }
    )

    socket.on(
      SOCKET_EVENTS.typingStop,
      (payload: { conversationId: number; userId: string }) => {
        if (payload.conversationId !== activeConversationId) return
        setTypingUsers((prev) => prev.filter((u) => u.userId !== payload.userId))
      }
    )

    socket.on(
      SOCKET_EVENTS.messageRead,
      (payload: { conversationId: number; messageIds: number[]; userId: string }) => {
        queryClient.setQueryData(
          messagesQueryKey(payload.conversationId),
          (prev: { pages: Array<{ messages: ChatMessageDTO[] }> } | undefined) => {
            if (!prev) return prev
            return {
              ...prev,
              pages: prev.pages.map((page) => ({
                ...page,
                messages: page.messages.map((m) =>
                  payload.messageIds.includes(m.id)
                    ? {
                        ...m,
                        readBy: [...new Set([...m.readBy, payload.userId])],
                        status: "Read" as const,
                      }
                    : m
                ),
              })),
            }
          }
        )
      }
    )

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [
    session?.user?.id,
    activeConversationId,
    upsertMessage,
    queryClient,
    updateConversationInCache,
  ])

  useEffect(() => {
    const socket = socketRef.current
    if (!socket || !activeConversationId) return

    socket.emit(SOCKET_EVENTS.joinConversation, { conversationId: activeConversationId })

    return () => {
      socket.emit(SOCKET_EVENTS.leaveConversation, { conversationId: activeConversationId })
      setTypingUsers([])
    }
  }, [activeConversationId])

  return { onlineUserIds, typingUsers }
}
