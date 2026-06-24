"use client"

import { useMemo } from "react"
import { financeRecordCards } from "@/components/finance/theme"
import Select from "@/components/ui/Select"
import type { FinanceTransaction } from "@/lib/finance/types"
import {
  filterTransactionsByPeriod,
  filterTransactionsByPreviousPeriod,
  formatPercentChange,
  getPercentDirection,
  RECORD_PERIOD_OPTIONS,
  type RecordPeriod,
} from "@/lib/finance/period-filter"
import { formatBRL, summarizeTransactions } from "@/lib/finance/summary"
import { ThreeDotsMenu } from "./shared/ThreeDotsMenu"
import { Sparkline } from "./shared/Sparkline"
import { FinancialRecordSkeleton } from "./FinancialRecordSkeleton"

type RecordCardProps = {
  title: string
  value: string
  percent: string
  percentDirection: "up" | "down" | "neutral"
  bgColor: string
  chartColor: string
  percentColor: string
}

function RecordCard({
  title,
  value,
  percent,
  percentDirection,
  bgColor,
  chartColor,
  percentColor,
}: RecordCardProps) {
  const arrow = percentDirection === "down" ? "↓" : "↑"

  return (
    <div
      className="relative flex h-[100px] min-w-0 flex-col justify-between rounded-[20px] p-4 sm:h-[115px] sm:p-5 lg:h-[130px]"
      style={{ backgroundColor: bgColor }}
    >
      <div className="flex items-start justify-between gap-2 pr-1">
        <span className="text-sm font-medium leading-snug text-finance-body">{title}</span>
        <ThreeDotsMenu />
      </div>

      <div className="pointer-events-none absolute right-5 top-1/2 hidden -translate-y-1/2 sm:block">
        <Sparkline color={chartColor} className="h-12 w-24" />
      </div>

      <div className="mt-auto flex flex-col gap-1 sm:pr-28">
        <span className="whitespace-nowrap text-xl font-bold tabular-nums leading-none text-finance-heading sm:text-2xl">
          {value}
        </span>
        {percentDirection !== "neutral" && (
          <span
            className="whitespace-nowrap text-sm font-semibold"
            style={{ color: percentColor }}
          >
            {arrow} {percent}
          </span>
        )}
      </div>
    </div>
  )
}

type FinancialRecordProps = {
  transactions: FinanceTransaction[]
  commissionRate: number
  period: RecordPeriod
  onPeriodChange: (period: RecordPeriod) => void
  isLoading?: boolean
}

export function FinancialRecord({
  transactions,
  commissionRate,
  period,
  onPeriodChange,
  isLoading = false,
}: FinancialRecordProps) {
  const cards = useMemo(() => {
    const current = summarizeTransactions(
      filterTransactionsByPeriod(transactions, period),
      commissionRate
    )
    const previous = summarizeTransactions(
      filterTransactionsByPreviousPeriod(transactions, period),
      commissionRate
    )

    return [
      {
        title: "Receita Total",
        value: formatBRL(current.totalIncome),
        percent: formatPercentChange(current.totalIncome, previous.totalIncome),
        percentDirection: getPercentDirection(current.totalIncome, previous.totalIncome),
        bgColor: financeRecordCards.income.bg,
        chartColor: financeRecordCards.income.chart,
        percentColor: financeRecordCards.income.percent,
      },
      {
        title: "Comissão dos Médicos",
        value: formatBRL(current.commission),
        percent: formatPercentChange(current.commission, previous.commission),
        percentDirection: getPercentDirection(current.commission, previous.commission),
        bgColor: financeRecordCards.expense.bg,
        chartColor: financeRecordCards.expense.chart,
        percentColor: financeRecordCards.expense.percent,
      },
      {
        title: "Despesas",
        value: formatBRL(current.expenseFromTransactions),
        percent: formatPercentChange(
          current.expenseFromTransactions,
          previous.expenseFromTransactions
        ),
        percentDirection: getPercentDirection(
          current.expenseFromTransactions,
          previous.expenseFromTransactions
        ),
        bgColor: financeRecordCards.saving.bg,
        chartColor: financeRecordCards.saving.chart,
        percentColor: financeRecordCards.saving.percent,
      },
    ]
  }, [transactions, commissionRate, period])

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-finance-heading">Registros</h2>
        <Select
          value={period}
          onChange={(value) => onPeriodChange(value as RecordPeriod)}
          options={[...RECORD_PERIOD_OPTIONS]}
          className="h-9 min-w-0 rounded-full border border-gray-200 px-4 py-0 text-sm text-finance-body focus:ring-purple-500/20"
        />
      </div>

      {isLoading ? (
        <FinancialRecordSkeleton />
      ) : (
        <div className="-mx-6 overflow-x-auto overscroll-x-contain px-6 pb-1 [scrollbar-width:thin] lg:mx-0 lg:px-0">
          <div className="grid w-full grid-cols-[repeat(3,minmax(300px,1fr))] gap-4 sm:gap-6">
            {cards.map((card) => (
              <RecordCard
                key={card.title}
                title={card.title}
                value={card.value}
                percent={card.percent}
                percentDirection={card.percentDirection}
                bgColor={card.bgColor}
                chartColor={card.chartColor}
                percentColor={card.percentColor}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
