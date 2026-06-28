"use client"

import { Suspense } from "react"
import { ChatLayout } from "@/components/chat/ChatLayout"
import { ChatLayoutSkeleton } from "@/components/chat/skeletons/ChatLayoutSkeleton"

export default function ChatPage() {
  return (
    <div className="flex h-full min-h-0 min-w-0 max-w-full flex-col">
      <div className="mt-3 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden sm:mt-4">
        <Suspense fallback={<ChatLayoutSkeleton mode="dual" />}>
          <ChatLayout />
        </Suspense>
      </div>
    </div>
  )
}
