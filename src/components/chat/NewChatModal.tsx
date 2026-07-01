"use client"

import { useEffect, useMemo, useState } from "react"
import { Loader2, MessageSquarePlus, Search } from "lucide-react"
import { resolveJobTitle } from "@/lib/chat/format"
import { useChatUsers } from "@/hooks/useChatUsers"
import { useCreateConversation } from "@/hooks/useCreateConversation"
import { Card } from "@/components/ui/card"
import { MessageAvatar } from "./MessageAvatar"
import { OnlineIndicator } from "./OnlineIndicator"

type Props = {
  open: boolean
  onClose: () => void
  onCreated: (conversationId: number) => void
}

export function NewChatModal({ open, onClose, onCreated }: Props) {
  const [search, setSearch] = useState("")
  const { data: users = [], isLoading } = useChatUsers()
  const createConversation = useCreateConversation()

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return users
    return users.filter(
      (u) =>
        u.name?.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.role?.toLowerCase().includes(q)
    )
  }, [users, search])

  useEffect(() => {
    if (!open) return

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handleEscape)
    return () => document.removeEventListener("keydown", handleEscape)
  }, [onClose, open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <Card className="relative z-10 flex max-h-[min(560px,90dvh)] w-full max-w-md flex-col overflow-hidden shadow-xl">
        <div className="border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <MessageSquarePlus size={20} className="text-primary" />
            <h3 className="text-lg font-semibold text-primary">Nova conversa</h3>
          </div>
          <p className="mt-1 text-xs text-secondary">
            Recepção, administradores e médicos podem conversar entre si.
          </p>
          <div className="relative mt-3">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-accent" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome, e-mail ou função..."
              className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50/80 pl-9 pr-3 text-sm outline-none focus:border-primary/40 focus:bg-white focus:ring-2 focus:ring-primary/10"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-secondary">Nenhum usuário encontrado</p>
          ) : (
            <ul className="space-y-1">
              {filtered.map((user) => (
                <li key={user.id}>
                  <button
                    type="button"
                    disabled={createConversation.isPending}
                    onClick={() => {
                      createConversation.mutate([user.id], {
                        onSuccess: (conv) => {
                          onCreated(conv.id)
                          onClose()
                        },
                      })
                    }}
                    className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition hover:bg-primary/[0.04] disabled:opacity-50"
                  >
                    <div className="relative">
                      <MessageAvatar name={user.name} image={user.image} size="md" />
                      <OnlineIndicator online={user.isOnline} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-gray-900">{user.name}</p>
                      <p className="truncate text-xs text-secondary">
                        {resolveJobTitle(user.role)} · {user.email}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>
    </div>
  )
}
