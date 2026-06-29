import { Avatar, type AvatarSize } from "@/components/common/Avatar"

type Props = {
  name?: string | null
  image?: string | null
  size?: "sm" | "md" | "lg"
  /** Destaque sobre fundo roxo (item de conversa selecionado). */
  selected?: boolean
  className?: string
}

const sizeMap: Record<"sm" | "md" | "lg", AvatarSize> = {
  sm: "sm",
  md: "md",
  lg: "lg",
}

export function MessageAvatar({ name, image, size = "md", selected, className }: Props) {
  const fallbackClass =
    selected
      ? "bg-white text-primary shadow-sm ring-2 ring-white/80"
      : "bg-gradient-to-br from-primary/15 to-primary/30 text-primary"

  return (
    <Avatar
      name={name}
      image={image}
      size={sizeMap[size]}
      className={className}
      initialsClassName={image ? undefined : fallbackClass}
    />
  )
}
