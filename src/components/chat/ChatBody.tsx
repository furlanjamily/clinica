"use client"

import { useEffect, useRef, useCallback } from "react"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ChatMessageDTO } from "@/lib/chat/types"
import { flattenMessages, useMessages } from "@/hooks/useMessages"
import { MessageBubble } from "./MessageBubble"
import { TypingIndicator } from "./TypingIndicator"
import { ChatMessagesSkeleton } from "./skeletons/ChatLayoutSkeleton"

type Props = {
  conversationId: number | null
  currentUserId: string
  search?: string
  typingUsers: Array<{ userId: string; name: string | null }>
  onReply?: (message: ChatMessageDTO) => void
  onEdit?: (message: ChatMessageDTO) => void
  onDelete?: (messageId: number) => void
  onMarkRead?: () => void
  className?: string
}

export function ChatBody({
  conversationId,
  currentUserId,
  search,
  typingUsers,
  onReply,
  onEdit,
  onDelete,
  onMarkRead,
  className,
}: Props) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useMessages(conversationId, search)
  const bottomRef = useRef<HTMLDivElement>(null)
  const topRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const initialScrollDone = useRef(false)

  const messages = flattenMessages(data?.pages)
  const lastMessageId = messages[messages.length - 1]?.id ?? null
  const onMarkReadRef = useRef(onMarkRead)
  const markedRef = useRef<{ conversationId: number | null; lastMessageId: number | null }>({
    conversationId: null,
    lastMessageId: null,
  })

  useEffect(() => {
    onMarkReadRef.current = onMarkRead
  }, [onMarkRead])

  useEffect(() => {
    initialScrollDone.current = false
    markedRef.current = { conversationId: null, lastMessageId: null }
  }, [conversationId])

  useEffect(() => {
    if (!conversationId || !messages.length || search) return

    const alreadyMarked =
      markedRef.current.conversationId === conversationId &&
      markedRef.current.lastMessageId === lastMessageId
    if (alreadyMarked) return

    markedRef.current = { conversationId, lastMessageId }

    if (!initialScrollDone.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" })
      initialScrollDone.current = true
    }

    onMarkReadRef.current?.()
  }, [conversationId, lastMessageId, messages.length, search])

  const handleScroll = useCallback(() => {
    const el = containerRef.current
    if (!el || !hasNextPage || isFetchingNextPage) return
    if (el.scrollTop < 80) {
      void fetchNextPage()
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage])

  if (!conversationId) {
    return (
      <div className={cn("flex flex-1 items-center justify-center bg-gray-50/40", className)}>
        <p className="text-sm text-secondary">Escolha uma conversa para começar</p>
      </div>
    )
  }

  if (isLoading) {
    return <ChatMessagesSkeleton className={className} />
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className={cn(
        "flex flex-1 flex-col overflow-y-auto overscroll-contain bg-gray-50/40 px-4 py-4 [-webkit-overflow-scrolling:touch]",
        className
      )}
    >
      <div ref={topRef} className="flex justify-center py-2">
        {isFetchingNextPage ? (
          <div className="flex justify-center py-1">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          </div>
        ) : hasNextPage ? (
          <span className="text-[11px] text-accent">Role para carregar mais</span>
        ) : null}
      </div>

      <div className="mx-auto flex w-full max-w-3xl flex-col gap-0.5">
        {messages.map((msg, idx) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            previousMessage={messages[idx - 1] ?? null}
            currentUserId={currentUserId}
            onReply={onReply}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>

      <TypingIndicator users={typingUsers} />
      <div ref={bottomRef} className="h-1 shrink-0" />
    </div>
  )
}
