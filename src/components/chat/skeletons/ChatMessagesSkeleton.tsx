import { cn } from "@/lib/utils"
import { ChatSkeletonBone } from "./ChatSkeletonBone"

type Props = {
  className?: string
}

function IncomingBubbleSkeleton() {
  return (
    <div className="flex w-full gap-2.5 px-2 py-0.5">
      <ChatSkeletonBone rounded="full" className="mt-1 h-8 w-8 shrink-0" />
      <div className="max-w-[min(420px,70%)] space-y-2 rounded-2xl rounded-bl-md border border-gray-100 bg-white px-4 py-3">
        <ChatSkeletonBone className="h-3 w-20" />
        <ChatSkeletonBone className="h-3 w-full" />
        <ChatSkeletonBone className="h-3 w-[85%]" />
      </div>
    </div>
  )
}

function OutgoingBubbleSkeleton() {
  return (
    <div className="flex w-full justify-end px-2 py-0.5">
      <div className="max-w-[min(380px,65%)] space-y-2 rounded-2xl rounded-br-md bg-primary/[0.06] px-4 py-3">
        <ChatSkeletonBone className="ml-auto h-3 w-full" />
        <ChatSkeletonBone className="ml-auto h-3 w-[70%]" />
      </div>
    </div>
  )
}

export function ChatMessagesSkeleton({ className }: Props) {
  return (
    <div
      className={cn(
        "flex flex-1 flex-col overflow-hidden bg-gray-50/40 px-4 py-4",
        className
      )}
    >
      <div className="relative my-4 flex items-center justify-center">
        <div className="absolute inset-x-8 top-1/2 h-px bg-gray-200" />
        <ChatSkeletonBone rounded="full" className="relative h-6 w-24" />
      </div>

      <div className="mx-auto flex w-full max-w-3xl flex-col gap-2">
        <IncomingBubbleSkeleton />
        <OutgoingBubbleSkeleton />
        <IncomingBubbleSkeleton />
        <OutgoingBubbleSkeleton />
        <div className="flex w-full justify-end px-2 py-0.5">
          <div className="max-w-[min(280px,50%)] space-y-2 rounded-2xl rounded-br-md bg-primary/[0.06] px-4 py-3">
            <ChatSkeletonBone className="ml-auto h-3 w-full" />
          </div>
        </div>
        <IncomingBubbleSkeleton />
      </div>
    </div>
  )
}
