"use client"

import { Trash2 } from "lucide-react"
import { financeRecordCards } from "@/components/finance/theme"
import { DataTable, Td } from "@/components/ui/table/DataTable"
import { Button } from "@/components/ui/button"
import { formatBRL } from "@/lib/finance/summary"
import {
  TransactionStatus,
  TransactionType,
  type FinanceTransaction,
} from "@/lib/finance/types"

type FinanceTransactionsTableProps = {
  transactions: FinanceTransaction[]
  onRemove: (id: number) => void
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
              className={`rounded-full px-2 py-1 text-xs font-medium ${
                transaction.type === TransactionType.Income
                  ? "text-primary"
                  : "text-secondary"
              }`}
              style={{
                backgroundColor:
                  transaction.type === TransactionType.Income
                    ? financeRecordCards.income.bg
                    : financeRecordCards.expense.bg,
              }}
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
            className={`font-semibold ${
              transaction.type === TransactionType.Income
                ? "text-primary"
                : "text-secondary"
            }`}
          >
            {transaction.type === TransactionType.Expense ? "- " : ""}
            {formatBRL(transaction.amount)}
          </Td>
          <Td>
            <span
              className={`rounded-full px-2 py-1 text-xs ${
                transaction.status === TransactionStatus.Confirmed
                  ? "text-primary"
                  : transaction.status === TransactionStatus.Pending
                    ? "text-amber-700"
                    : "text-secondary"
              }`}
              style={{
                backgroundColor:
                  transaction.status === TransactionStatus.Confirmed
                    ? financeRecordCards.income.bg
                    : transaction.status === TransactionStatus.Pending
                      ? "#FEF3C7"
                      : financeRecordCards.expense.bg,
              }}
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
