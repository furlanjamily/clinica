import { cn } from "@/lib/utils"

type Props = {
  online?: boolean
  className?: string
}

export function OnlineIndicator({ online, className }: Props) {
  if (!online) return null
  return (
    <span
      className={cn(
        "absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500",
        className
      )}
      aria-label="Online"
    />
  )
}
