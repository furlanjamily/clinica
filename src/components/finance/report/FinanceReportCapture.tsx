"use client"

import { MoneyFlowChart } from "@/components/finance/MoneyFlowChart"
import { CommissionFlowChart } from "@/components/finance/CommissionFlowChart"
import { formatBRL, getTotalExpenses, summarizeTransactions } from "@/lib/finance/summary"
import { filterTransactionsByPeriod, type RecordPeriod } from "@/lib/finance/period-filter"
import type { FinanceTransaction } from "@/lib/finance/types"
import { useMemo } from "react"

type FinanceReportCaptureProps = {
  transactions: FinanceTransaction[]
  period: RecordPeriod
  commissionRate: number
}

function CaptureLegend({
  totalIncome,
  totalExpense,
  totalBalance,
}: {
  totalIncome: number
  totalExpense: number
  totalBalance: number
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
      <span className="flex items-center gap-2 text-sm text-finance-body">
        <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />
        Receita Total: <strong className="text-finance-heading">{formatBRL(totalIncome)}</strong>
      </span>
      <span className="flex items-center gap-2 text-sm text-finance-body">
        <span className="h-2 w-2 shrink-0 rounded-full bg-secondary" />
        Despesa Total: <strong className="text-finance-heading">{formatBRL(totalExpense)}</strong>
      </span>
      <span className="flex items-center gap-2 text-sm text-finance-body">
        <span className="h-2 w-2 shrink-0 rounded-full bg-finance-balance" />
        Saldo: <strong className="text-finance-heading">{formatBRL(totalBalance)}</strong>
      </span>
    </div>
  )
}

/** Área off-screen para captura dos gráficos da dashboard em alta resolução. */
export function FinanceReportCapture({
  transactions,
  period,
  commissionRate,
}: FinanceReportCaptureProps) {
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
    <div
      aria-hidden
      className="pointer-events-none fixed left-[-10000px] top-0 z-[-1] flex flex-col gap-8 bg-white p-4"
    >
      <div data-report-chart="money-flow" className="w-[720px]">
        <div className="mb-3">
          <CaptureLegend
            totalIncome={totalIncome}
            totalExpense={totalExpense}
            totalBalance={balance}
          />
        </div>
        <MoneyFlowChart
          transactions={transactions}
          period={period}
          commissionRate={commissionRate}
        />
      </div>

      <CommissionFlowChart
        transactions={transactions}
        period={period}
        commissionRate={commissionRate}
      />
    </div>
  )
}
