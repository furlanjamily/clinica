import { cn } from "@/lib/utils"

type Props = {
  count: number
  selected?: boolean
  className?: string
}

export function UnreadCounter({ count, selected, className }: Props) {
  if (count <= 0) return null
  return (
    <span
      className={cn(
        "flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold",
        selected ? "bg-white text-primary" : "bg-primary text-white",
        className
      )}
    >
      {count > 99 ? "99+" : count}
    </span>
  )
}
