"use client"

import { MessageSquarePlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/ui/PageHeader"
import { ChatLayout } from "@/components/chat/ChatLayout"

export default function ChatPage() {
  return (
    <div className="flex h-full min-h-0 min-w-0 max-w-full flex-col">
      <div className="mt-3 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden sm:mt-4">
        <ChatLayout />
      </div>
    </div>
  )
}
