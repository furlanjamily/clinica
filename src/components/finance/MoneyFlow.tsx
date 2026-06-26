"use client"

import { useMemo } from "react"
import { filterTransactionsByPeriod, type RecordPeriod } from "@/lib/finance/period-filter"
import { formatBRL, getTotalExpenses, summarizeTransactions } from "@/lib/finance/summary"
import type { FinanceTransaction } from "@/lib/finance/types"
import { MoneyFlowChart } from "./MoneyFlowChart"
import { MoneyFlowChartSkeleton, MoneyFlowLegendSkeleton } from "./MoneyFlowSkeleton"

type MoneyFlowProps = {
  transactions: FinanceTransaction[]
  period: RecordPeriod
  commissionRate: number
  isLoading?: boolean
}

function Legend({
  totalIncome,
  totalExpense,
  totalBalance,
}: {
  totalIncome: number
  totalExpense: number
  totalBalance: number
}) {
  return (
    <>
      <span className="flex items-center gap-2 text-sm text-finance-body">
        <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />
        <span>
          Receita Total:{" "}
          <strong className="text-finance-heading">{formatBRL(totalIncome)}</strong>
        </span>
      </span>
      <span className="flex items-center gap-2 text-sm text-finance-body">
        <span className="h-2 w-2 shrink-0 rounded-full bg-secondary" />
        <span>
          Despesa Total:{" "}
          <strong className="text-finance-heading">{formatBRL(totalExpense)}</strong>
        </span>
      </span>
      <span className="flex items-center gap-2 text-sm text-finance-body">
        <span className="h-2 w-2 shrink-0 rounded-full bg-finance-balance" />
        <span>
          Saldo:{" "}
          <strong className="text-finance-heading">{formatBRL(totalBalance)}</strong>
        </span>
      </span>
    </>
  )
}

export function MoneyFlow({
  transactions,
  period,
  commissionRate,
  isLoading = false,
}: MoneyFlowProps) {
  const { totalIncome, balance, totalExpense } = useMemo(() => {
    const summary = summarizeTransactions(
      filterTransactionsByPeriod(transactions, period),
      commissionRate
    )
    return {
      totalIncome: summary.totalIncome,
      balance: summary.balance,
      totalExpense: getTotalExpenses(summary),
    }
  }, [transactions, period, commissionRate])

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-finance-heading">Fluxo de Caixa</h2>

        <div className="flex flex-wrap items-center justify-end gap-x-5 gap-y-2">
          {isLoading ? (
            <MoneyFlowLegendSkeleton />
          ) : (
            <Legend
              totalIncome={totalIncome}
              totalExpense={totalExpense}
              totalBalance={balance}
            />
          )}
        </div>
      </div>

      {isLoading ? (
        <MoneyFlowChartSkeleton />
      ) : (
        <MoneyFlowChart
          transactions={transactions}
          period={period}
          commissionRate={commissionRate}
        />
      )}
    </section>
  )
}
