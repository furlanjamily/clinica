import { cn } from "@/lib/utils"

type Props = {
  muted?: boolean
  favorite?: boolean
  className?: string
}

export function ConversationBadge({ muted, favorite, className }: Props) {
  if (!muted && !favorite) return null
  return (
    <span className={cn("flex items-center gap-1 text-[10px] text-accent", className)}>
      {favorite ? "★" : null}
      {muted ? "🔇" : null}
    </span>
  )
}
