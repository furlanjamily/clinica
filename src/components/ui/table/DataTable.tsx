"use client"

import { ReactNode, useMemo, useState } from "react"
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"

/**
 * Card branco com scroll interno — mesmo padrão da tabela de atendimentos.
 * Use direto quando precisar de conteúdo customizado (ex.: skeleton).
 */
export function TableCard({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <Card className={cn("flex min-h-0 min-w-0 flex-1 overflow-hidden", className)}>
      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-auto overscroll-contain [-webkit-overflow-scrolling:touch] scroll-pb-4 pb-4 sm:pb-3">
        {children}
      </div>
    </Card>
  )
}

export function Td({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      className={cn("border-b border-gray-100 px-3 py-2.5 text-xs sm:px-4 sm:py-3 sm:text-sm", className)}
      {...props}
    />
  )
}

type SortValue = string | number | null | undefined

export type DataTableHeader<T> =
  | string
  | {
      label: string
      /** Habilita a ordenação da coluna: extrai o valor usado na comparação */
      sort?: (row: T) => SortValue
      /** Alinhamento do cabeçalho (ex.: "right" para a última coluna). Default: "left" */
      align?: "left" | "center" | "right"
    }

type SortState = { index: number; dir: "asc" | "desc" }

const PAGE_SIZE_OPTIONS = [10, 25, 50]

function headerLabel<T>(h: DataTableHeader<T>) {
  return typeof h === "string" ? h : h.label
}

function compareValues(a: SortValue, b: SortValue) {
  if (a == null && b == null) return 0
  if (a == null) return 1
  if (b == null) return -1
  if (typeof a === "number" && typeof b === "number") return a - b
  return String(a).localeCompare(String(b), "pt-BR", { numeric: true, sensitivity: "base" })
}

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

type DataTableProps<T> = {
  headers: DataTableHeader<T>[]
  /**
   * Modo dado: passe `data` + `renderRow` para habilitar ordenação e paginação.
   * Sem eles, as linhas vêm via `children` (sem ordenação/paginação).
   */
  data?: T[]
  renderRow?: (row: T, index: number) => ReactNode
  /** Paginação no rodapé (apenas no modo dado). Default: true */
  paginate?: boolean
  /** Quando true (modo children), exibe o estado vazio centralizado dentro do card */
  isEmpty?: boolean
  emptyMessage?: string
  /** Largura mínima da tabela para o scroll horizontal (ex.: "min-w-[600px]") */
  minWidthClassName?: string
  className?: string
  /** Linhas do tbody (modo children) */
  children?: ReactNode
}

export function DataTable<T>({
  headers,
  data,
  renderRow,
  paginate = true,
  isEmpty,
  emptyMessage = "nenhum registro",
  minWidthClassName = "min-w-[min(100%,36rem)] sm:min-w-[600px]",
  className,
  children,
}: DataTableProps<T>) {
  const [sort, setSort] = useState<SortState | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0])

  const isDataMode = data !== undefined && renderRow !== undefined

  const sorted = useMemo(() => {
    const rows = data ?? []
    if (!sort) return rows
    const col = headers[sort.index]
    const accessor = typeof col === "object" ? col.sort : undefined
    if (!accessor) return rows
    const factor = sort.dir === "asc" ? 1 : -1
    return [...rows].sort((a, b) => factor * compareValues(accessor(a), accessor(b)))
  }, [data, sort, headers])

  const total = sorted.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(page, totalPages)
  const pageRows = isDataMode && paginate
    ? sorted.slice((safePage - 1) * pageSize, safePage * pageSize)
    : sorted

  const empty = isDataMode ? total === 0 : isEmpty
  const showFooter = isDataMode && paginate && total > 0

  function toggleSort(index: number) {
    setPage(1)
    setSort((prev) => {
      if (prev?.index !== index) return { index, dir: "asc" }
      if (prev.dir === "asc") return { index, dir: "desc" }
      return null
    })
  }

  return (
    <Card className={cn("flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden", className)}>
      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-auto overscroll-contain [-webkit-overflow-scrolling:touch]">
        <table className={cn("w-full border-separate border-spacing-0", empty && "h-full", minWidthClassName)}>
          <thead>
            <tr>
              {headers.map((h, i) => {
                const sortable = typeof h === "object" && !!h.sort
                const active = sort?.index === i
                const align = typeof h === "object" ? h.align ?? "left" : "left"
                return (
                  <th
                    key={`${headerLabel(h)}-${i}`}
                    style={{ width: `${100 / headers.length}%` }}
                    className={cn(
                      "sticky top-0 z-10 whitespace-nowrap border-b border-gray-200 bg-gray-50 px-3 py-2.5 text-[11px] font-medium text-gray-500 sm:px-4 sm:py-3 sm:text-xs",
                      align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left"
                    )}
                  >
                    {sortable ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(i)}
                        className={cn(
                          "flex w-full items-center gap-1 transition-colors hover:text-gray-800",
                          align === "right" ? "justify-end" : align === "center" ? "justify-center" : "justify-start",
                          active && "text-gray-800"
                        )}
                      >
                        {headerLabel(h)}
                        {active ? (
                          sort!.dir === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />
                        ) : (
                          <ChevronsUpDown size={12} className="text-gray-400" />
                        )}
                      </button>
                    ) : (
                      headerLabel(h)
                    )}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody className={empty ? "w-full h-full" : undefined}>
            {empty ? (
              <tr className="h-full">
                <td
                  colSpan={headers.length}
                  className="px-3 py-16 text-center align-middle text-sm leading-relaxed text-gray-400"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : isDataMode ? (
              pageRows.map((row, i) => renderRow!(row, i))
            ) : (
              children
            )}
          </tbody>
        </table>
      </div>

      {showFooter && (
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-gray-200 px-3 py-2.5 sm:px-4">
          <div className="flex items-center gap-2 text-xs text-gray-500 sm:text-sm">
            <span>Exibir</span>
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1) }}
              className="cursor-pointer rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            >
              {PAGE_SIZE_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <span>de {total} resultado{total === 1 ? "" : "s"}</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label="Página anterior"
              disabled={safePage === 1}
              onClick={() => setPage(safePage - 1)}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft size={14} />
            </button>

            {getPageItems(safePage, totalPages).map((p, i) =>
              p === "..." ? (
                <span key={`ellipsis-${i}`} className="px-1 text-xs text-gray-400">…</span>
              ) : (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPage(p)}
                  className={cn(
                    "h-7 min-w-7 rounded-lg px-1.5 text-xs font-medium transition-colors",
                    p === safePage
                      ? "bg-[#9747FF] text-white"
                      : "text-gray-600 hover:bg-gray-100"
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
              onClick={() => setPage(safePage + 1)}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </Card>
  )
}
