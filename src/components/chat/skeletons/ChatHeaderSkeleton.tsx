import { cn } from "@/lib/utils"
import { ChatSkeletonBone } from "./ChatSkeletonBone"

type Props = {
  className?: string
}

export function ChatHeaderSkeleton({ className }: Props) {
  return (
    <header
      className={cn(
        "flex shrink-0 items-center justify-between gap-4 border-b border-gray-100 bg-white px-5 py-4",
        className
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <ChatSkeletonBone rounded="full" className="h-14 w-14 shrink-0" />
        <div className="space-y-2">
          <ChatSkeletonBone className="h-5 w-36" />
          <ChatSkeletonBone className="h-3.5 w-24" />
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        {Array.from({ length: 3 }).map((_, i) => (
          <ChatSkeletonBone key={i} rounded="full" className="h-10 w-10" />
        ))}
      </div>
    </header>
  )
}
