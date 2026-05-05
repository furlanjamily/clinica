import { Suspense } from "react"
import { TableSkeleton } from "@/components/ui/TableSkeleton"

interface TableSuspenseProps {
  children: React.ReactNode
  cols?: number
  rows?: number
}

export function TableSuspense({ children, cols = 5, rows = 6 }: TableSuspenseProps) {
  return (
    <Suspense fallback={<TableSkeleton cols={cols} rows={rows} />}>
      {children}
    </Suspense>
  )
}
