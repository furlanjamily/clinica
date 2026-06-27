"use client"

import { Search } from "lucide-react"
import { cn } from "@/lib/utils"

type Props = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function ConversationSearch({
  value,
  onChange,
  placeholder = "Pesquisar...",
  className,
}: Props) {
  return (
    <div className={cn("relative", className)}>
      <Search
        size={16}
        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-accent"
      />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-2xl border border-gray-200 bg-gray-50/80 pl-10 pr-4 text-sm text-gray-800 outline-none transition-shadow placeholder:text-accent focus:border-primary/40 focus:bg-white focus:shadow-sm focus:ring-2 focus:ring-primary/10"
      />
    </div>
  )
}
