import { cn } from "@/lib/utils"
import { ChatSkeletonBone } from "./ChatSkeletonBone"

type Props = {
  className?: string
}

export function ChatInputSkeleton({ className }: Props) {
  return (
    <div className={cn("shrink-0 border-t border-gray-100 bg-white px-4 py-4", className)}>
      <div className="flex items-center gap-2 rounded-[28px] border border-gray-200 bg-gray-50/50 px-3 py-2">
        <ChatSkeletonBone rounded="full" className="h-10 w-10 shrink-0" />
        <ChatSkeletonBone rounded="lg" className="h-10 min-h-[40px] flex-1" />
        <ChatSkeletonBone rounded="full" className="h-10 w-10 shrink-0" />
        <ChatSkeletonBone rounded="full" className="h-10 w-10 shrink-0 bg-primary/20" />
      </div>
    </div>
  )
}
