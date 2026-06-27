import { cn } from "@/lib/utils"
import { ChatSkeletonBone } from "./ChatSkeletonBone"

type Props = {
  className?: string
}

function FileRowSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50/50 p-3">
      <ChatSkeletonBone rounded="lg" className="h-10 w-10 shrink-0" />
      <div className="min-w-0 flex-1 space-y-2">
        <ChatSkeletonBone className="h-3.5 w-[70%]" />
        <ChatSkeletonBone className="h-2.5 w-16" />
      </div>
    </div>
  )
}

export function RightSidebarSkeleton({ className }: Props) {
  return (
    <aside className={cn("flex h-full w-full flex-col overflow-hidden", className)}>
      <div className="border-b border-gray-100 px-5 py-4">
        <ChatSkeletonBone className="h-6 w-24" />
        <ChatSkeletonBone className="mt-2 h-3 w-40" />
      </div>

      <div className="flex-1 space-y-6 px-4 py-5">
        <div>
          <div className="mb-3 flex items-center gap-2">
            <ChatSkeletonBone rounded="sm" className="h-4 w-4" />
            <ChatSkeletonBone className="h-4 w-16" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <ChatSkeletonBone key={i} rounded="lg" className="aspect-square w-full" />
            ))}
          </div>
        </div>

        <div>
          <div className="mb-3 flex items-center gap-2">
            <ChatSkeletonBone rounded="sm" className="h-4 w-4" />
            <ChatSkeletonBone className="h-4 w-20" />
          </div>
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <FileRowSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </aside>
  )
}
