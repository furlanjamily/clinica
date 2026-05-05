import { AttendanceClient } from "./AttendanceClient"
import { TableSuspense } from "@/components/ui/TableSuspense"
import { Header } from "@/components/ui/PageHeader"

export default function AttendancePage() {
  return (
    <div className="flex h-full min-h-0 flex-col gap-4 sm:gap-6">
      <Header title="Atendimentos" />
      <TableSuspense cols={5} rows={4}>
        <AttendanceClient />
      </TableSuspense>
    </div>
  )
}
