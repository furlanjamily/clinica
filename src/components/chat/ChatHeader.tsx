"use client"

import { FolderOpen, List, Settings } from "lucide-react"
import { cn } from "@/lib/utils"
import { resolveJobTitle } from "@/lib/chat/format"
import type { ConversationDTO } from "@/lib/chat/types"
import { MessageAvatar } from "./MessageAvatar"
import { OnlineIndicator } from "./OnlineIndicator"

type Props = {
  conversation: ConversationDTO | null
  online?: boolean
  onSearchInChat?: (q: string) => void
  showFilesButton?: boolean
  filesActive?: boolean
  onToggleFiles?: () => void
  className?: string
}

export function ChatHeader({
  conversation,
  online,
  onSearchInChat,
  showFilesButton = false,
  filesActive = false,
  onToggleFiles,
  className,
}: Props) {
  if (!conversation) {
    return (
      <div
        className={cn(
          "flex h-[88px] shrink-0 items-center justify-center border-b border-gray-100 bg-white",
          className
        )}
      >
        <p className="text-sm text-secondary">Selecione uma conversa</p>
      </div>
    )
  }

  const other = conversation.otherParticipant
  const isGroup = conversation.type === "Group"
  const name = isGroup
    ? (conversation.title ?? "Grupo")
    : (other?.name ?? conversation.title ?? "Conversa")
  const role = isGroup
    ? `${conversation.participants.length} participantes`
    : resolveJobTitle(other?.role)
  const avatarImage = isGroup ? null : other?.image

  const actions = [
    {
      icon: List,
      label: "Lista",
      onClick: () => onSearchInChat?.(""),
      active: false,
    },
    ...(showFilesButton
      ? [
          {
            icon: FolderOpen,
            label: "Arquivos",
            onClick: onToggleFiles,
            active: filesActive,
          },
        ]
      : []),
    {
      icon: Settings,
      label: "Configurações",
      onClick: undefined,
      active: false,
    },
  ]

  return (
    <header
      className={cn(
        "flex shrink-0 items-center justify-between gap-4 border-b border-gray-100 bg-white px-5 py-4",
        className
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className="relative">
          <MessageAvatar name={name} image={avatarImage} size="lg" />
          <OnlineIndicator online={online} className="h-3 w-3" />
        </div>
        <div className="min-w-0">
          <h3 className="truncate text-lg font-semibold text-gray-900">{name}</h3>
          {role ? <p className="text-sm text-secondary">{role}</p> : null}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        {actions.map(({ icon: Icon, label, onClick, active }) => (
          <button
            key={label}
            type="button"
            aria-label={label}
            aria-pressed={active || undefined}
            onClick={onClick}
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full transition",
              active
                ? "bg-primary/10 text-primary"
                : "bg-gray-50 text-secondary hover:bg-primary/10 hover:text-primary",
              !onClick && active && "cursor-default"
            )}
          >
            <Icon size={18} />
          </button>
        ))}
      </div>
    </header>
  )
}
