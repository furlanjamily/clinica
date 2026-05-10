import { AttendanceClient } from "./AttendanceClient"
import { TableSuspense } from "@/components/ui/TableSuspense"
import { Header } from "@/components/ui/PageHeader"

export default function AttendancePage() {
  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <Header title="Atendimentos" />
      {/* Conteúdo cresce com a página — o scroll principal é o do AdminShell (main).
          O histórico continua com scroll só na caixa da tabela (max-h em AttendanceTable). */}
      <TableSuspense cols={5} rows={4}>
        <AttendanceClient />
      </TableSuspense>
    </div>
  )
}
