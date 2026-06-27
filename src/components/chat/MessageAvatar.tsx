import { cn } from "@/lib/utils"
import { getInitials } from "@/lib/chat/format"
import Image from "next/image"

type Props = {
  name?: string | null
  image?: string | null
  size?: "sm" | "md" | "lg"
  /** Destaque sobre fundo roxo (item de conversa selecionado). */
  selected?: boolean
  className?: string
}

const sizeMap = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-base",
}

export function MessageAvatar({ name, image, size = "md", selected, className }: Props) {
  const cls = cn(
    "relative flex shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold",
    sizeMap[size],
    selected
      ? "bg-white text-primary shadow-sm ring-2 ring-white/80"
      : "bg-gradient-to-br from-primary/15 to-primary/30 text-primary",
    className
  )

  if (image) {
    return (
      <div className={cls}>
        <Image src={image} alt={name ?? "Avatar"} fill className="object-cover" unoptimized />
      </div>
    )
  }

  return <div className={cls}>{getInitials(name)}</div>
}
