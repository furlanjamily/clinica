"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useQueryClient } from "@tanstack/react-query"
import { io, type Socket } from "socket.io-client"
import { SOCKET_EVENTS } from "@/lib/chat/socket-events"
import { useChatCacheUpdater } from "./useChat"
import { deliverMessageApi } from "./chat-api"
import {
  getSocketServerUrl,
  isRealtimeEnabled,
} from "@/lib/chat/realtime-config"
import type { ChatMessageDTO, ConversationDTO } from "@/lib/chat/types"
import { invalidateNotificationQueries } from "./invalidate-notifications"
import { invalidateChatQueries } from "./invalidate-chat"

type TypingState = {
  userId: string
  name: string | null
}

export function useRealtime(activeConversationId: number | null) {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const { updateConversationInCache } = useChatCacheUpdater()
  const socketRef = useRef<Socket | null>(null)
  const activeConversationIdRef = useRef(activeConversationId)
  const joinedConversationIdRef = useRef<number | null>(null)
  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([])
  const [typingUsers, setTypingUsers] = useState<TypingState[]>([])

  useEffect(() => {
    activeConversationIdRef.current = activeConversationId
  }, [activeConversationId])

  const upsertMessage = useCallback(
    (conversationId: number, message: ChatMessageDTO, mode: "new" | "edit") => {
      let updated = false

      queryClient.setQueriesData(
        { queryKey: ["chat", "messages", conversationId] },
        (prev: { pages: Array<{ messages: ChatMessageDTO[] }>; pageParams: unknown[] } | undefined) => {
          if (!prev?.pages?.length) return prev
          updated = true
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

      if (!updated) {
        void queryClient.invalidateQueries({
          queryKey: ["chat", "messages", conversationId],
        })
      }
    },
    [queryClient]
  )

  const joinConversationRoom = useCallback((socket: Socket, conversationId: number) => {
    if (joinedConversationIdRef.current === conversationId) return

    if (joinedConversationIdRef.current != null) {
      socket.emit(SOCKET_EVENTS.leaveConversation, {
        conversationId: joinedConversationIdRef.current,
      })
    }

    socket.emit(SOCKET_EVENTS.joinConversation, { conversationId })
    joinedConversationIdRef.current = conversationId
  }, [])

  const leaveConversationRoom = useCallback((socket: Socket) => {
    if (joinedConversationIdRef.current == null) return
    socket.emit(SOCKET_EVENTS.leaveConversation, {
      conversationId: joinedConversationIdRef.current,
    })
    joinedConversationIdRef.current = null
  }, [])

  useEffect(() => {
    const userId = session?.user?.id
    if (!userId || !isRealtimeEnabled()) return

    const socket = io(getSocketServerUrl(), {
      path: "/api/socketio",
      withCredentials: true,
      transports: ["websocket", "polling"],
      reconnectionAttempts: 3,
    })

    socketRef.current = socket

    const joinActiveConversation = () => {
      const id = activeConversationIdRef.current
      if (id != null) joinConversationRoom(socket, id)
    }

    socket.on("connect", joinActiveConversation)

    socket.on(SOCKET_EVENTS.onlineUsers, (payload: { userIds: string[] }) => {
      setOnlineUserIds(payload.userIds ?? [])
    })

    socket.on(SOCKET_EVENTS.newMessage, (payload: { message: ChatMessageDTO }) => {
      const msg = payload.message
      upsertMessage(msg.conversationId, msg, "new")

      if (msg.senderId !== userId) {
        invalidateNotificationQueries(queryClient)
        invalidateChatQueries(queryClient)
      }

      if (
        msg.conversationId === activeConversationIdRef.current &&
        msg.senderId !== userId
      ) {
        void deliverMessageApi(msg.id)
      }
    })

    socket.on(SOCKET_EVENTS.messageEdited, (payload: { message: ChatMessageDTO }) => {
      upsertMessage(payload.message.conversationId, payload.message, "edit")
    })

    socket.on(SOCKET_EVENTS.messageDeleted, (payload: { messageId: number; conversationId: number }) => {
      queryClient.setQueriesData(
        { queryKey: ["chat", "messages", payload.conversationId] },
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
        invalidateChatQueries(queryClient)
      }
    )

    socket.on(
      SOCKET_EVENTS.typingStart,
      (payload: { conversationId: number; user: TypingState }) => {
        if (payload.conversationId !== activeConversationIdRef.current) return
        if (payload.user.userId === userId) return
        setTypingUsers((prev) => {
          if (prev.some((u) => u.userId === payload.user.userId)) return prev
          return [...prev, payload.user]
        })
      }
    )

    socket.on(
      SOCKET_EVENTS.typingStop,
      (payload: { conversationId: number; userId: string }) => {
        if (payload.conversationId !== activeConversationIdRef.current) return
        setTypingUsers((prev) => prev.filter((u) => u.userId !== payload.userId))
      }
    )

    socket.on(
      SOCKET_EVENTS.messageRead,
      (payload: { conversationId: number; messageIds: number[]; userId: string }) => {
        queryClient.setQueriesData(
          { queryKey: ["chat", "messages", payload.conversationId] },
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
      socket.off("connect", joinActiveConversation)
      leaveConversationRoom(socket)
      socket.disconnect()
      socketRef.current = null
    }
  }, [
    session?.user?.id,
    upsertMessage,
    queryClient,
    updateConversationInCache,
    joinConversationRoom,
    leaveConversationRoom,
  ])

  useEffect(() => {
    const socket = socketRef.current
    if (!socket) return

    if (activeConversationId == null) {
      leaveConversationRoom(socket)
      setTypingUsers([])
      return
    }

    const join = () => joinConversationRoom(socket, activeConversationId)

    if (socket.connected) {
      join()
    } else {
      socket.once("connect", join)
    }

    return () => {
      socket.off("connect", join)
      setTypingUsers([])
    }
  }, [activeConversationId, joinConversationRoom, leaveConversationRoom])

  return { onlineUserIds, typingUsers }
}
