import { Suspense } from "react"
import { TableSkeleton } from "@/components/ui/TableSkeleton"
import { TableCard } from "@/components/ui/table/DataTable"

interface TableSuspenseProps {
  children: React.ReactNode
  cols?: number
  rows?: number
}

export function TableSuspense({ children, cols = 5, rows = 6 }: TableSuspenseProps) {
  return (
    <Suspense
      fallback={
        <TableCard>
          <div className="p-2 sm:p-3">
            <TableSkeleton cols={cols} rows={rows} />
          </div>
        </TableCard>
      }
    >
      {children}
    </Suspense>
  )
}
