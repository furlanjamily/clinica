"use client"

import { useMemo } from "react"
import { financeColors } from "@/components/finance/theme"
import {
  buildMoneyFlowData,
  buildMoneyFlowChartData,
  CHART_HEIGHT,
  CHART_PAD_X,
  CHART_WIDTH,
  pointsToSmoothPath,
} from "@/lib/finance/money-flow"
import type { RecordPeriod } from "@/lib/finance/period-filter"
import { calculateCommission } from "@/lib/finance/summary"
import type { FinanceTransaction } from "@/lib/finance/types"

type CommissionFlowChartProps = {
  transactions: FinanceTransaction[]
  period: RecordPeriod
  commissionRate: number
}

export function CommissionFlowChart({
  transactions,
  period,
  commissionRate,
}: CommissionFlowChartProps) {
  const flowPoints = useMemo(
    () => buildMoneyFlowData(transactions, period, commissionRate),
    [transactions, period, commissionRate]
  )

  const commissionPoints = useMemo(
    () =>
      flowPoints.map((point) => ({
        ...point,
        income: calculateCommission(point.income, commissionRate),
        expense: 0,
        balance: calculateCommission(point.income, commissionRate),
      })),
    [flowPoints, commissionRate]
  )

  const chart = useMemo(
    () => buildMoneyFlowChartData(commissionPoints, period),
    [commissionPoints, period]
  )

  const commissionPath = pointsToSmoothPath(chart.incomePoints)
  const xPadPercent = (CHART_PAD_X / CHART_WIDTH) * 100

  return (
    <div
      data-report-chart="commission"
      className="relative flex min-h-[320px] w-[720px] flex-col rounded-3xl bg-white px-6 pb-4 pt-6 shadow-sm"
    >
      <div className="mb-3 flex flex-wrap items-center gap-x-5 gap-y-2">
        <span className="flex items-center gap-2 text-sm text-finance-body">
          <span className="h-2 w-2 shrink-0 rounded-full bg-secondary" />
          Comissão médica acumulada no período
        </span>
      </div>

      <div className="flex min-h-0 flex-1">
        <div className="mr-4 flex w-14 shrink-0 flex-col justify-between pb-6 pt-1">
          {chart.yLabels.map((label, index) => (
            <span key={index} className="text-[11px] text-finance-muted">
              {label}
            </span>
          ))}
        </div>

        <div className="relative min-w-0 flex-1 overflow-visible">
          <svg
            viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
            preserveAspectRatio="xMidYMid meet"
            overflow="visible"
            className="absolute inset-0 h-[calc(100%-28px)] w-full overflow-visible"
            aria-hidden
          >
            {chart.gridLineYs.map((y, i) => (
              <line
                key={i}
                x1={CHART_PAD_X}
                y1={y}
                x2={CHART_WIDTH - CHART_PAD_X}
                y2={y}
                stroke={financeColors.divider}
                strokeWidth="1"
              />
            ))}

            {commissionPath && (
              <path
                d={commissionPath}
                fill="none"
                stroke={financeColors.secondary}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
          </svg>

          <div
            className="absolute bottom-0 left-0 right-0"
            style={{ paddingLeft: `${xPadPercent}%`, paddingRight: `${xPadPercent}%` }}
          >
            <div className="flex justify-between gap-0.5">
              {flowPoints.map((point) => (
                <span
                  key={point.date}
                  className="min-w-0 flex-1 truncate text-center text-[10px] text-finance-muted"
                  title={point.label}
                >
                  {point.label.split(",")[0].split(" ")[0]}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
