import { formatMessageTime } from "@/lib/chat/format"
import { cn } from "@/lib/utils"

type Props = {
  time: string
  className?: string
}

export function MessageTime({ time, className }: Props) {
  return (
    <span className={cn("text-[11px] text-accent", className)}>
      {formatMessageTime(time)}
    </span>
  )
}
