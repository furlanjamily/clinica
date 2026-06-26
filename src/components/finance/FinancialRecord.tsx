"use client"

import { useMemo } from "react"
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
import { cn } from "@/lib/utils"
import { financeColors } from "@/components/finance/theme"
import { ThreeDotsMenu } from "./shared/ThreeDotsMenu"
import { Sparkline } from "./shared/Sparkline"
import { FinancialRecordSkeleton } from "./FinancialRecordSkeleton"

type RecordCardVariant = "income" | "commission" | "expense"

const RECORD_CARD_STYLES: Record<
  RecordCardVariant,
  { cardClass: string; percentClass: string; chartColor: string }
> = {
  income: {
    cardClass: "bg-finance-light-bg",
    percentClass: "text-finance-primary-hover",
    chartColor: financeColors.primary,
  },
  commission: {
    cardClass: "bg-finance-secondary-bg",
    percentClass: "text-secondary",
    chartColor: financeColors.secondary,
  },
  expense: {
    cardClass: "bg-finance-saving-bg",
    percentClass: "text-finance-primary-dark",
    chartColor: financeColors.primaryHover,
  },
}

type RecordCardProps = {
  title: string
  value: string
  percent: string
  percentDirection: "up" | "down" | "neutral"
  variant: RecordCardVariant
}

function RecordCard({
  title,
  value,
  percent,
  percentDirection,
  variant,
}: RecordCardProps) {
  const styles = RECORD_CARD_STYLES[variant]
  const arrow = percentDirection === "down" ? "↓" : "↑"

  return (
    <div
      className={cn(
        "relative flex h-[130px] min-w-[300px] flex-col justify-between rounded-[20px] px-3 py-6",
        styles.cardClass
      )}
    >
      <div className="flex items-start justify-between gap-2 pr-1">
        <span className="text-sm font-medium leading-snug text-finance-body">{title}</span>
        <ThreeDotsMenu />
      </div>

      <div className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2">
        <Sparkline color={styles.chartColor} className="h-12 w-24" />
      </div>

      <div className="mt-auto flex flex-col gap-1 pr-28">
        <span className="whitespace-nowrap text-2xl font-bold tabular-nums leading-none text-finance-heading">
          {value}
        </span>
        {percentDirection !== "neutral" && (
          <span className={cn("whitespace-nowrap text-sm font-semibold", styles.percentClass)}>
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
        variant: "income" as const,
        title: "Receita Total",
        value: formatBRL(current.totalIncome),
        percent: formatPercentChange(current.totalIncome, previous.totalIncome),
        percentDirection: getPercentDirection(current.totalIncome, previous.totalIncome),
      },
      {
        variant: "commission" as const,
        title: "Comissão dos Médicos",
        value: formatBRL(current.commission),
        percent: formatPercentChange(current.commission, previous.commission),
        percentDirection: getPercentDirection(current.commission, previous.commission),
      },
      {
        variant: "expense" as const,
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
          <div className="grid w-max min-w-full grid-cols-3 gap-6 lg:w-full lg:grid-cols-[repeat(3,minmax(300px,1fr))]">
            {cards.map((card) => (
              <RecordCard
                key={card.title}
                variant={card.variant}
                title={card.title}
                value={card.value}
                percent={card.percent}
                percentDirection={card.percentDirection}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
