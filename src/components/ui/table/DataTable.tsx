"use client"

import { ReactNode, useMemo, useState } from "react"
import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"
import { PAGE_SIZE_OPTIONS, TablePagination, type TablePaginationProps } from "@/components/ui/table/TablePagination"

/**
 * Card branco com scroll interno — mesmo padrão da tabela de atendimentos.
 * Use direto quando precisar de conteúdo customizado (ex.: skeleton).
 */
const tableScrollClass = cn(
  "min-h-0 min-w-0 flex-1 overflow-auto overscroll-contain",
  "[-webkit-overflow-scrolling:touch] [scrollbar-width:thin]",
  "pb-4 sm:pb-3"
)

export function TableCard({
  className,
  children,
  footer,
}: {
  className?: string
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <Card className={cn("flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden", className)}>
      <div className={tableScrollClass}>{children}</div>
      {footer}
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
  /** Paginação externa (modo children) */
  pagination?: TablePaginationProps
}

export function DataTable<T>({
  headers,
  data,
  renderRow,
  paginate = true,
  isEmpty,
  emptyMessage = "nenhum registro",
  minWidthClassName,
  className,
  children,
  pagination,
}: DataTableProps<T>) {
  const [sort, setSort] = useState<SortState | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZE_OPTIONS[0])

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
  const showFooter =
    (isDataMode && paginate && total > 0) ||
    (!isDataMode && !!pagination && pagination.total > 0)

  function toggleSort(index: number) {
    setPage(1)
    setSort((prev) => {
      if (prev?.index !== index) return { index, dir: "asc" }
      if (prev.dir === "asc") return { index, dir: "desc" }
      return null
    })
  }

  return (
    <Card className={cn("flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden", className)}>
      <div className={tableScrollClass}>
        <table
          className={cn(
            "w-max min-w-full border-separate border-spacing-0",
            empty && "h-full",
            minWidthClassName
          )}
        >
          <thead>
            <tr>
              {headers.map((h, i) => {
                const sortable = typeof h === "object" && !!h.sort
                const active = sort?.index === i
                const align = typeof h === "object" ? h.align ?? "left" : "left"
                return (
                  <th
                    key={`${headerLabel(h)}-${i}`}
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
        <TablePagination
          page={pagination?.page ?? safePage}
          pageSize={pagination?.pageSize ?? pageSize}
          total={pagination?.total ?? total}
          onPageChange={pagination?.onPageChange ?? setPage}
          onPageSizeChange={
            pagination?.onPageSizeChange ??
            ((size) => {
              setPageSize(size)
              setPage(1)
            })
          }
        />
      )}
    </Card>
  )
}
