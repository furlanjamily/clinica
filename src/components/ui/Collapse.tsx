"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"

interface CollapseProps {
  label?: string
  defaultOpen?: boolean
  children: React.ReactNode
  className?: string
  /** Sem teto de altura no painel (evita área rolável própria nos filtros) */
  unboundedPanel?: boolean
}

export function Collapse({
  label = "Filtros",
  defaultOpen = false,
  children,
  className,
  unboundedPanel = false,
}: CollapseProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center gap-2 rounded-md py-2 text-left text-sm font-medium text-gray-600 transition-colors hover:text-gray-900 lg:hidden"
      >
        <ChevronDown
          size={16}
          className={`transition-transform duration-200 ${open ? "rotate-180" : "rotate-0"}`}
        />
        {label}
      </button>

      <div
        className={`
          lg:block lg:max-h-none lg:opacity-100 lg:mt-0
          overflow-hidden transition-all duration-200
          ${open
            ? unboundedPanel
              ? "mt-3 max-h-none opacity-100"
              : "mt-3 max-h-[min(75vh,36rem)] opacity-100"
            : "max-h-0 opacity-0 lg:max-h-none lg:opacity-100"}
        `}
      >
        {children}
      </div>
    </div>
  )
}
