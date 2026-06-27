import { cn } from "@/lib/utils"
import { ChatSkeletonBone } from "./ChatSkeletonBone"

type Props = {
  rows?: number
  className?: string
}

function ConversationRowSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-2xl px-3 py-2.5">
      <ChatSkeletonBone rounded="full" className="h-10 w-10 shrink-0" />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <ChatSkeletonBone className="h-3.5 w-[55%]" />
          <ChatSkeletonBone className="h-2.5 w-10" />
        </div>
        <ChatSkeletonBone className="h-2.5 w-[75%]" />
      </div>
    </div>
  )
}

export function ConversationSidebarSkeleton({ rows = 6, className }: Props) {
  return (
    <aside className={cn("flex h-full w-full flex-col overflow-hidden", className)}>
      <div className="flex items-center justify-between border-b border-gray-100 px-5 pb-3 pt-5">
        <ChatSkeletonBone className="h-6 w-28" />
        <div className="flex gap-1">
          <ChatSkeletonBone rounded="lg" className="h-9 w-9" />
          <ChatSkeletonBone rounded="lg" className="h-9 w-9" />
        </div>
      </div>

      <div className="px-4 pb-4 pt-3">
        <ChatSkeletonBone rounded="lg" className="h-11 w-full" />
      </div>

      <div className="flex-1 space-y-4 px-4 pb-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <ChatSkeletonBone className="h-2.5 w-20" />
            <ChatSkeletonBone rounded="sm" className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <ChatSkeletonBone key={i} rounded="lg" className="h-9 w-full" />
            ))}
          </div>
        </div>

        <div className="space-y-1">
          <ChatSkeletonBone className="mb-2 h-2.5 w-24 px-1" />
          {Array.from({ length: rows }).map((_, i) => (
            <ConversationRowSkeleton key={i} />
          ))}
        </div>
      </div>
    </aside>
  )
}
