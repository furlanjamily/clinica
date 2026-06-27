"use client"

import { ChevronDown, Plus } from "lucide-react"
import { cn } from "@/lib/utils"

type Props = {
  categories: string[]
  activeCategory: string | null
  onSelect: (category: string | null) => void
  counts: Record<string, number>
}

const DEFAULT_CATEGORIES = ["Importante", "Trabalho", "Equipe"]

export function CategoryList({
  categories,
  activeCategory,
  onSelect,
  counts,
}: Props) {
  const all = [...new Set([...DEFAULT_CATEGORIES, ...categories])]

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-accent">
          Categorias
        </span>
        <button
          type="button"
          className="rounded-lg p-1 text-accent transition hover:bg-primary/5 hover:text-primary"
          aria-label="Adicionar categoria"
        >
          <Plus size={14} />
        </button>
      </div>
      <div className="space-y-1">
        {all.map((cat) => {
          const active = activeCategory === cat
          const count = counts[cat] ?? 0
          return (
            <button
              key={cat}
              type="button"
              onClick={() => onSelect(active ? null : cat)}
              className={cn(
                "flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm font-medium transition-all",
                active
                  ? "bg-primary text-white shadow-sm shadow-primary/15"
                  : "text-secondary hover:bg-primary/[0.04] hover:text-primary"
              )}
            >
              <span className="flex items-center gap-2">
                {active ? <ChevronDown size={14} /> : null}
                {cat}
              </span>
              {count > 0 ? (
                <span
                  className={cn(
                    "flex h-5 min-w-5 items-center justify-center rounded-full text-[10px] font-bold",
                    active ? "bg-white/20 text-white" : "bg-primary/10 text-primary"
                  )}
                >
                  {count}
                </span>
              ) : null}
            </button>
          )
        })}
      </div>
    </div>
  )
}
