"use client"

import { ArrowUpRight, MessageSquarePlus } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ConversationDTO } from "@/lib/chat/types"
import { ConversationSearch } from "./ConversationSearch"
import { CategoryList } from "./CategoryList"
import { ConversationItem } from "./ConversationItem"

type Props = {
  conversations: ConversationDTO[]
  categories: string[]
  selectedId: number | null
  search: string
  onSearchChange: (v: string) => void
  activeCategory: string | null
  onCategoryChange: (c: string | null) => void
  onSelect: (id: number) => void
  onNewChat?: () => void
  onlineUserIds: string[]
  className?: string
}

export function ConversationSidebar({
  conversations,
  categories,
  selectedId,
  search,
  onSearchChange,
  activeCategory,
  onCategoryChange,
  onSelect,
  onNewChat,
  onlineUserIds,
  className,
}: Props) {
  const filtered = activeCategory
    ? conversations.filter((c) => c.category === activeCategory)
    : conversations

  const uncategorized = conversations.filter((c) => !c.category)

  const categoryCounts = conversations.reduce<Record<string, number>>((acc, c) => {
    if (c.category) acc[c.category] = (acc[c.category] ?? 0) + 1
    return acc
  }, {})

  return (
    <aside className={cn("flex h-full w-full flex-col overflow-hidden", className)}>
      <div className="flex items-center justify-between border-b border-gray-100 px-5 pb-3 pt-5">
        <h2 className="text-lg font-semibold text-primary">Conversas</h2>
        <div className="flex items-center gap-1">
          {onNewChat ? (
            <button
              type="button"
              onClick={onNewChat}
              className="rounded-xl p-2 text-secondary transition hover:bg-primary/5 hover:text-primary"
              aria-label="Nova conversa"
              title="Nova conversa"
            >
              <MessageSquarePlus size={18} />
            </button>
          ) : null}
          <button
            type="button"
            className="rounded-xl p-2 text-accent transition hover:bg-gray-50 hover:text-secondary"
            aria-label="Expandir"
          >
            <ArrowUpRight size={18} />
          </button>
        </div>
      </div>

      <div className="px-4 pb-4 pt-3">
        <ConversationSearch value={search} onChange={onSearchChange} />
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain px-3 pb-4 [-webkit-overflow-scrolling:touch]">
        <div className="space-y-4 px-1">
          <CategoryList
            categories={categories}
            activeCategory={activeCategory}
            onSelect={onCategoryChange}
            counts={categoryCounts}
          />

          {activeCategory ? (
            <div className="space-y-1">
              {filtered.map((conv) => (
                <ConversationItem
                  key={conv.id}
                  conversation={conv}
                  selected={conv.id === selectedId}
                  online={conv.otherParticipant?.id ? onlineUserIds.includes(conv.otherParticipant.id) : false}
                  onClick={() => onSelect(conv.id)}
                />
              ))}
            </div>
          ) : (
            <>
              {filtered.some((c) => c.category) ? (
                <div className="space-y-1">
                  {filtered.filter((c) => c.category).map((conv) => (
                    <ConversationItem
                      key={conv.id}
                      conversation={conv}
                      selected={conv.id === selectedId}
                      online={
                        conv.otherParticipant?.id
                          ? onlineUserIds.includes(conv.otherParticipant.id)
                          : false
                      }
                      onClick={() => onSelect(conv.id)}
                    />
                  ))}
                </div>
              ) : null}

              <div>
                <span className="mb-2 block px-1 text-[10px] font-bold uppercase tracking-wider text-accent">
                  Todas as conversas
                </span>
                <div className="space-y-1">
                  {(uncategorized.length ? uncategorized : filtered).map((conv) => (
                    <ConversationItem
                      key={conv.id}
                      conversation={conv}
                      selected={conv.id === selectedId}
                      online={
                        conv.otherParticipant?.id
                          ? onlineUserIds.includes(conv.otherParticipant.id)
                          : false
                      }
                      onClick={() => onSelect(conv.id)}
                    />
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </aside>
  )
}
