import { Check, CheckCheck } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ChatMessageStatusValue } from "@/lib/chat/types"

type Props = {
  status: ChatMessageStatusValue
  isOwn: boolean
  readByOthers: boolean
  className?: string
}

export function MessageStatus({ status, isOwn, readByOthers, className }: Props) {
  if (!isOwn) return null

  const isRead = status === "Read" || readByOthers
  const isDelivered = status === "Delivered" || isRead

  return (
    <span className={cn("inline-flex items-center", className)} aria-label={status}>
      {isRead ? (
        <CheckCheck size={14} className="text-primary" />
      ) : isDelivered ? (
        <CheckCheck size={14} className="text-accent" />
      ) : (
        <Check size={14} className="text-accent" />
      )}
    </span>
  )
}
