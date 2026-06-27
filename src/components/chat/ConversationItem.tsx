"use client"

import { cn } from "@/lib/utils"
import { formatConversationTime } from "@/lib/chat/format"
import type { ConversationDTO } from "@/lib/chat/types"
import { MessageAvatar } from "./MessageAvatar"
import { OnlineIndicator } from "./OnlineIndicator"
import { UnreadCounter } from "./UnreadCounter"

type Props = {
  conversation: ConversationDTO
  selected: boolean
  online?: boolean
  onClick: () => void
}

function displayName(conv: ConversationDTO): string {
  if (conv.type === "Group" && conv.title) return conv.title
  return conv.otherParticipant?.name ?? conv.title ?? "Conversa"
}

function displayAvatar(conv: ConversationDTO): string | null | undefined {
  if (conv.type === "Group") return null
  return conv.otherParticipant?.image
}

function previewText(conv: ConversationDTO): string {
  const msg = conv.lastMessage
  if (!msg) return "Nenhuma mensagem ainda"
  if (msg.isDeleted) return "Mensagem excluída"
  return msg.content ?? "Anexo"
}

export function ConversationItem({ conversation, selected, online, onClick }: Props) {
  const name = displayName(conversation)
  const avatar = displayAvatar(conversation)

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-all duration-200",
        selected
          ? "bg-primary text-white shadow-md shadow-primary/20"
          : "hover:bg-primary/[0.04]"
      )}
    >
      <div className="relative shrink-0">
        <MessageAvatar name={name} image={avatar} size="md" selected={selected} />
        <OnlineIndicator online={online} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className={cn("truncate text-sm font-semibold", selected ? "text-white" : "text-gray-900")}>
            {name}
          </span>
          <span className={cn("shrink-0 text-[11px]", selected ? "text-white/80" : "text-accent")}>
            {formatConversationTime(conversation.lastMessageAt)}
          </span>
        </div>
        <div className="mt-0.5 flex items-center justify-between gap-2">
          <p className={cn("truncate text-xs", selected ? "text-white/85" : "text-secondary")}>
            {previewText(conversation)}
          </p>
          <UnreadCounter count={conversation.unreadCount} selected={selected} />
        </div>
      </div>
    </button>
  )
}
