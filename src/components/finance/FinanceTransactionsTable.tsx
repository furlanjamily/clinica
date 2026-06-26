"use client"

import { Trash2 } from "lucide-react"
import { DataTable, Td } from "@/components/ui/table/DataTable"
import { Button } from "@/components/ui/button"
import { formatBRL } from "@/lib/finance/summary"
import {
  TransactionStatus,
  TransactionType,
  type FinanceTransaction,
} from "@/lib/finance/types"
import { cn } from "@/lib/utils"

type FinanceTransactionsTableProps = {
  transactions: FinanceTransaction[]
  onRemove: (id: number) => void
}

function typeBadgeClass(type: FinanceTransaction["type"]): string {
  return type === TransactionType.Income
    ? "bg-finance-light-bg text-primary"
    : "bg-finance-secondary-bg text-secondary"
}

function statusBadgeClass(status: FinanceTransaction["status"]): string {
  if (status === TransactionStatus.Confirmed) {
    return "bg-finance-light-bg text-primary"
  }
  if (status === TransactionStatus.Pending) {
    return "bg-amber-100 text-amber-700"
  }
  return "bg-finance-secondary-bg text-secondary"
}

export function FinanceTransactionsTable({
  transactions,
  onRemove,
}: FinanceTransactionsTableProps) {
  return (
    <DataTable<FinanceTransaction>
      className="[&_th]:text-finance-muted [&_th_button:hover]:text-finance-heading [&_th_button.text-gray-800]:text-finance-heading"
      headers={[
        { label: "Data", sort: (transaction) => transaction.date },
        { label: "Tipo", sort: (transaction) => transaction.type },
        { label: "Categoria", sort: (transaction) => transaction.category },
        { label: "Descrição", sort: (transaction) => transaction.description },
        { label: "Forma Pgto", sort: (transaction) => transaction.paymentMethod ?? null },
        {
          label: "Valor",
          sort: (transaction) =>
            transaction.amount *
            (transaction.type === TransactionType.Expense ? -1 : 1),
        },
        { label: "Status", sort: (transaction) => transaction.status },
        { label: "Ações", align: "right" },
      ]}
      data={transactions}
      emptyMessage="Nenhuma transação encontrada"
      renderRow={(transaction) => (
        <tr key={transaction.id} className="transition-colors hover:bg-gray-50/80">
          <Td className="text-finance-body">{transaction.date}</Td>
          <Td>
            <span
              className={cn(
                "rounded-full px-2 py-1 text-xs font-medium",
                typeBadgeClass(transaction.type)
              )}
            >
              {transaction.type}
            </span>
          </Td>
          <Td className="text-finance-body">{transaction.category}</Td>
          <Td className="max-w-[14rem] break-words text-finance-body">
            {transaction.description}
          </Td>
          <Td className="text-finance-body">{transaction.paymentMethod ?? "—"}</Td>
          <Td
            className={cn(
              "font-semibold",
              transaction.type === TransactionType.Income ? "text-primary" : "text-secondary"
            )}
          >
            {transaction.type === TransactionType.Expense ? "- " : ""}
            {formatBRL(transaction.amount)}
          </Td>
          <Td>
            <span
              className={cn(
                "rounded-full px-2 py-1 text-xs",
                statusBadgeClass(transaction.status)
              )}
            >
              {transaction.status}
            </span>
          </Td>
          <Td>
            <div className="flex justify-end">
              <Button variant="ghost-danger" onClick={() => onRemove(transaction.id)}>
                <Trash2 size={14} />
              </Button>
            </div>
          </Td>
        </tr>
      )}
    />
  )
}
