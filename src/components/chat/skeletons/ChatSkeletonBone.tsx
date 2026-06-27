import { cn } from "@/lib/utils"

type Props = {
  className?: string
  rounded?: "sm" | "md" | "lg" | "full"
}

const roundedMap = {
  sm: "rounded-md",
  md: "rounded-lg",
  lg: "rounded-xl",
  full: "rounded-full",
} as const

export function ChatSkeletonBone({ className, rounded = "md" }: Props) {
  return (
    <div
      className={cn("animate-pulse bg-gray-100", roundedMap[rounded], className)}
      aria-hidden
    />
  )
}
