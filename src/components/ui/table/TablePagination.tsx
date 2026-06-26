"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

export const PAGE_SIZE_OPTIONS: number[] = [10, 25, 50]

function getPageItems(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages: (number | "...")[] = [1]
  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)
  if (start > 2) pages.push("...")
  for (let p = start; p <= end; p++) pages.push(p)
  if (end < total - 1) pages.push("...")
  pages.push(total)
  return pages
}

type TablePaginationProps = {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
}

export type { TablePaginationProps }

export function TablePagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
}: TablePaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(page, totalPages)

  return (
    <div className="flex shrink-0 flex-col items-center gap-3 border-t border-gray-200 px-3 py-2.5 max-md:justify-center sm:flex-row sm:items-center sm:justify-between sm:px-4">
      <div className="flex items-center justify-center gap-2 text-xs text-gray-500 sm:text-sm">
        <span>Exibir</span>
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="cursor-pointer rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
        >
          {PAGE_SIZE_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <span>
          de {total} resultado{total === 1 ? "" : "s"}
        </span>
      </div>

      <div className="flex items-center justify-center gap-1">
        <button
          type="button"
          aria-label="Página anterior"
          disabled={safePage === 1}
          onClick={() => onPageChange(safePage - 1)}
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft size={14} />
        </button>

        {getPageItems(safePage, totalPages).map((p, i) =>
          p === "..." ? (
            <span key={`ellipsis-${i}`} className="px-1 text-xs text-gray-400">
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              className={cn(
                "h-7 min-w-7 rounded-lg px-1.5 text-xs font-medium transition-colors",
                p === safePage ? "bg-[#9747FF] text-white" : "text-gray-600 hover:bg-gray-100"
              )}
            >
              {p}
            </button>
          )
        )}

        <button
          type="button"
          aria-label="Próxima página"
          disabled={safePage === totalPages}
          onClick={() => onPageChange(safePage + 1)}
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}
