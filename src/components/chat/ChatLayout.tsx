"use client"

import { useState, useCallback, useEffect } from "react"
import { useSession } from "next-auth/react"
import { AnimatePresence, motion } from "framer-motion"
import { Menu } from "lucide-react"
import { cn } from "@/lib/utils"
import { useChatLayoutMode } from "@/hooks/useChatLayoutMode"
import { useConversationSearch } from "@/hooks/useConversationSearch"
import { useConversation, useConversationAttachments } from "@/hooks/useConversation"
import { useRealtime } from "@/hooks/useRealtime"
import { useSendMessage, useMessageRead } from "@/hooks/useSendMessage"
import { useTyping } from "@/hooks/useTyping"
import { CHAT_LAYOUT, getSidebarWidth } from "@/lib/chat/layout"
import type { ChatMessageDTO } from "@/lib/chat/types"
import { ChatCard } from "./ChatCard"
import { ConversationSidebar } from "./ConversationSidebar"
import { ChatHeader } from "./ChatHeader"
import { ChatBody } from "./ChatBody"
import { ChatInput } from "./ChatInput"
import { NewChatModal } from "./NewChatModal"
import { RightSidebar } from "./RightSidebar"
import { FilesDrawer } from "./FilesDrawer"
import {
  ChatLayoutSkeleton,
  ConversationSidebarSkeleton,
  ChatHeaderSkeleton,
  RightSidebarSkeleton,
} from "./skeletons/ChatLayoutSkeleton"

type Props = {
  className?: string
}

type MobilePanel = "list" | "chat"

const mobilePanelTransition = {
  type: "tween" as const,
  duration: 0.28,
  ease: [0.32, 0.72, 0, 1] as [number, number, number, number],
}

export function ChatLayout({ className }: Props) {
  const { mode, containerRef } = useChatLayoutMode()
  const { data: session, status: sessionStatus } = useSession()
  const userId = session?.user?.id ?? ""
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>("list")
  const [filesOpen, setFilesOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [replyTo, setReplyTo] = useState<ChatMessageDTO | null>(null)
  const [editing, setEditing] = useState<ChatMessageDTO | null>(null)
  const [newChatOpen, setNewChatOpen] = useState(false)

  const {
    search,
    messageSearch,
    onSearchChange,
    onMessageSearchChange,
    conversations,
    categories,
    isLoading: isConversationsLoading,
  } = useConversationSearch()

  const { data: activeConversation, isLoading: isConversationLoading } =
    useConversation(selectedId)
  const { data: attachments = [], isLoading: isAttachmentsLoading } =
    useConversationAttachments(selectedId)
  const { onlineUserIds, typingUsers } = useRealtime(selectedId)
  const { sendMessage, editMessage, removeMessage } = useSendMessage(selectedId)
  const { markAsRead } = useMessageRead(selectedId)
  const { startTyping } = useTyping(selectedId)

  const handleSelect = useCallback(
    (id: number) => {
      setSelectedId(id)
      setReplyTo(null)
      setEditing(null)
      if (mode === "mobile") setMobilePanel("chat")
    },
    [mode]
  )

  useEffect(() => {
    if (mode === "mobile") return
    if (!selectedId && conversations.length > 0) {
      setSelectedId(conversations[0].id)
    }
  }, [conversations, selectedId, mode])

  useEffect(() => {
    if (mode === "triple") setFilesOpen(false)
  }, [mode])

  useEffect(() => {
    if (mode === "mobile" && mobilePanel === "list") setFilesOpen(false)
  }, [mode, mobilePanel])

  useEffect(() => {
    const openNew = () => setNewChatOpen(true)
    document.addEventListener("chat:open-new", openNew)
    return () => document.removeEventListener("chat:open-new", openNew)
  }, [])

  const handleSend = useCallback(
    async (content: string, replyToId?: number, files?: File[]) => {
      if (editing) {
        await editMessage(editing.id, content)
        setEditing(null)
        return
      }
      await sendMessage(content, replyToId, files)
    },
    [editing, editMessage, sendMessage]
  )

  const otherOnline =
    activeConversation?.otherParticipant?.id != null
      ? onlineUserIds.includes(activeConversation.otherParticipant.id)
      : false

  const showFullSkeleton =
    sessionStatus === "loading" ||
    (isConversationsLoading && conversations.length === 0)

  const sidebarSelectedId =
    mode === "mobile" && mobilePanel === "list" ? null : selectedId

  const desktopMode: "dual" | "triple" = mode === "triple" ? "triple" : "dual"
  const sidebarWidth = getSidebarWidth(desktopMode)
  const filesWidth = CHAT_LAYOUT.columns.files
  const chatMinWidth = CHAT_LAYOUT.columns.chatMin

  const conversationsPanel = isConversationsLoading ? (
    <ConversationSidebarSkeleton />
  ) : (
    <ConversationSidebar
      conversations={conversations}
      categories={categories}
      selectedId={sidebarSelectedId}
      search={search}
      onSearchChange={onSearchChange}
      activeCategory={activeCategory}
      onCategoryChange={setActiveCategory}
      onSelect={handleSelect}
      onNewChat={() => setNewChatOpen(true)}
      onlineUserIds={onlineUserIds}
    />
  )

  const filesPanelInline = mode === "triple"
  const filesToggle = () => setFilesOpen((open) => !open)

  const chatContent = (
    <>
      {selectedId && isConversationLoading ? (
        <ChatHeaderSkeleton />
      ) : (
        <ChatHeader
          conversation={activeConversation ?? null}
          online={otherOnline}
          onSearchInChat={onMessageSearchChange}
          showFilesButton
          filesActive={filesPanelInline ? true : filesOpen}
          onToggleFiles={filesPanelInline ? undefined : filesToggle}
        />
      )}
      <ChatBody
        conversationId={selectedId}
        currentUserId={userId}
        search={messageSearch || undefined}
        typingUsers={typingUsers}
        onReply={setReplyTo}
        onEdit={setEditing}
        onDelete={(id) => void removeMessage(id)}
        onMarkRead={() => void markAsRead()}
      />
      <ChatInput
        onSend={handleSend}
        onTyping={startTyping}
        replyTo={replyTo}
        editingContent={editing?.content ?? undefined}
        onCancelReply={() => {
          setReplyTo(null)
          setEditing(null)
        }}
        disabled={!selectedId}
      />
    </>
  )

  const newChatModal = (
    <NewChatModal
      open={newChatOpen}
      onClose={() => setNewChatOpen(false)}
      onCreated={handleSelect}
    />
  )

  if (showFullSkeleton) {
    return (
      <ChatLayoutSkeleton
        className={className}
        mode={mode === "mobile" ? "mobile" : desktopMode}
      />
    )
  }

  if (mode === "mobile") {
    return (
      <div
        ref={containerRef}
        className={cn(
          "@container/chat relative h-full min-h-0 w-full overflow-hidden",
          className
        )}
      >
        <AnimatePresence mode="wait" initial={false}>
          {mobilePanel === "list" ? (
            <motion.div
              key="list"
              initial={{ x: "-28%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "-28%", opacity: 0 }}
              transition={mobilePanelTransition}
              className="absolute inset-0 flex flex-col"
            >
              <ChatCard className="h-full min-h-0 w-full flex-1">
                {conversationsPanel}
              </ChatCard>
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={mobilePanelTransition}
              className="absolute inset-0 flex min-h-0 flex-col gap-2"
            >
              <ChatCard className="flex min-h-0 min-w-0 max-h-[calc(100%-3.25rem)] flex-1 flex-col">
                {chatContent}
              </ChatCard>
              <div className="flex shrink-0 items-center px-0.5 pb-0.5">
                <button
                  type="button"
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-white shadow-md shadow-primary/25 transition hover:bg-primary/90 active:scale-95"
                  onClick={() => setMobilePanel("list")}
                  aria-label="Voltar para conversas"
                >
                  <Menu size={20} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <FilesDrawer
          open={filesOpen}
          onClose={() => setFilesOpen(false)}
          attachments={attachments}
          isLoading={Boolean(selectedId && isAttachmentsLoading)}
          layout="mobile"
        />

        {newChatModal}
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "@container/chat flex h-full min-h-0 w-full min-w-0 gap-3 overflow-x-auto sm:gap-4",
        className
      )}
    >
      <div className="min-h-0 shrink-0" style={{ width: sidebarWidth }}>
        <ChatCard className="h-full w-full">{conversationsPanel}</ChatCard>
      </div>

      <div
        className="relative flex min-h-0 min-w-0 flex-1 flex-col"
        style={{ minWidth: chatMinWidth }}
      >
        <ChatCard className="flex min-h-0 min-w-0 flex-1 flex-col">
          {chatContent}
        </ChatCard>

        {mode === "dual" ? (
          <FilesDrawer
            open={filesOpen}
            onClose={() => setFilesOpen(false)}
            attachments={attachments}
            isLoading={Boolean(selectedId && isAttachmentsLoading)}
            layout="dual"
          />
        ) : null}
      </div>

      {mode === "triple" ? (
        <div className="min-h-0 shrink-0" style={{ width: filesWidth }}>
          <ChatCard className="h-full w-full">
            {selectedId && isAttachmentsLoading ? (
              <RightSidebarSkeleton />
            ) : (
              <RightSidebar attachments={attachments} />
            )}
          </ChatCard>
        </div>
      ) : null}

      {newChatModal}
    </div>
  )
}