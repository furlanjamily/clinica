import { cn } from "@/lib/utils"
import { CHAT_LAYOUT, getSidebarWidth, type ChatLayoutMode } from "@/lib/chat/layout"
import { ChatCard } from "../ChatCard"
import { ConversationSidebarSkeleton } from "./ConversationSidebarSkeleton"
import { ChatHeaderSkeleton } from "./ChatHeaderSkeleton"
import { ChatMessagesSkeleton } from "./ChatMessagesSkeleton"
import { ChatInputSkeleton } from "./ChatInputSkeleton"
import { RightSidebarSkeleton } from "./RightSidebarSkeleton"

type Props = {
  className?: string
  mode?: ChatLayoutMode
}

/** Skeleton completo das colunas do chat. */
export function ChatLayoutSkeleton({ className, mode = "dual" }: Props) {
  if (mode === "mobile") {
    return (
      <div className={cn("flex h-full min-h-0 w-full flex-col", className)}>
        <ChatCard className="flex min-h-0 flex-1 flex-col">
          <ConversationSidebarSkeleton />
        </ChatCard>
      </div>
    )
  }

  const sidebarWidth = getSidebarWidth(mode === "triple" ? "triple" : "dual")
  const filesWidth = CHAT_LAYOUT.columns.files

  return (
    <div
      className={cn(
        "flex h-full min-h-0 w-full gap-3 sm:gap-4",
        className
      )}
    >
      <ChatCard
        className="hidden h-full shrink-0 min-[974px]:flex"
        style={{ width: sidebarWidth }}
      >
        <ConversationSidebarSkeleton />
      </ChatCard>

      <ChatCard
        className="flex min-h-0 min-w-0 flex-1 flex-col"
        style={{ minWidth: CHAT_LAYOUT.columns.chatMin }}
      >
        <ChatHeaderSkeleton />
        <ChatMessagesSkeleton />
        <ChatInputSkeleton />
      </ChatCard>

      {mode === "triple" ? (
        <ChatCard
          className="hidden h-full shrink-0 min-[974px]:flex"
          style={{ width: filesWidth }}
        >
          <RightSidebarSkeleton />
        </ChatCard>
      ) : null}
    </div>
  )
}

export { ConversationSidebarSkeleton } from "./ConversationSidebarSkeleton"
export { ChatHeaderSkeleton } from "./ChatHeaderSkeleton"
export { ChatMessagesSkeleton } from "./ChatMessagesSkeleton"
export { ChatInputSkeleton } from "./ChatInputSkeleton"
export { RightSidebarSkeleton } from "./RightSidebarSkeleton"
export { ChatSkeletonBone } from "./ChatSkeletonBone"
