import { TableSkeleton } from "@/components/ui/TableSkeleton"
import { AdminShell } from "./AdminShell"
import { Suspense } from "react"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AdminShell>
      {/* <Suspense fallback={<TableSkeleton />}> */}
        {children}
      {/* </Suspense> */}
    </AdminShell>
  )
}