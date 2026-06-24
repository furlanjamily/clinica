"use client"

import { useMemo } from "react"
import { financeColors } from "@/components/finance/theme"
import {
  buildMoneyFlowChartData,
  buildMoneyFlowData,
  CHART_HEIGHT,
  CHART_PAD_X,
  CHART_WIDTH,
  pointsToSmoothPath,
} from "@/lib/finance/money-flow"
import type { RecordPeriod } from "@/lib/finance/period-filter"
import { formatBRL } from "@/lib/finance/summary"
import type { FinanceTransaction } from "@/lib/finance/types"

type MoneyFlowChartProps = {
  transactions: FinanceTransaction[]
  period: RecordPeriod
  commissionRate: number
}

function tooltipAlignClass(index: number, total: number): string {
  if (total <= 1) return "-translate-x-1/2"
  if (index <= 0) return "translate-x-0"
  if (index >= total - 1) return "-translate-x-full"
  return "-translate-x-1/2"
}

function shouldShowXLabel(index: number, total: number, period: RecordPeriod): boolean {
  if (total <= 7) return true
  if (period === "mes") {
    if (total <= 14) return index % 2 === 0 || index === total - 1
    return index % 5 === 0 || index === total - 1
  }
  if (period === "ano") return true
  return index % Math.ceil(total / 7) === 0 || index === total - 1
}

function shortLabel(label: string, period: RecordPeriod): string {
  if (period === "semana") return label.split(",")[0]
  if (period === "mes") return label.split(" ")[0]
  return label
}

export function MoneyFlowChart({
  transactions,
  period,
  commissionRate,
}: MoneyFlowChartProps) {
  const flowPoints = useMemo(
    () => buildMoneyFlowData(transactions, period, commissionRate),
    [transactions, period, commissionRate]
  )

  const chart = useMemo(
    () => buildMoneyFlowChartData(flowPoints, period),
    [flowPoints, period]
  )

  const incomePath = pointsToSmoothPath(chart.incomePoints)
  const expensePath = pointsToSmoothPath(chart.expensePoints)
  const balancePath = pointsToSmoothPath(chart.balancePoints)
  const highlight = chart.incomePoints[chart.highlightIndex]
  const xPadPercent = (CHART_PAD_X / CHART_WIDTH) * 100
  const hasHighlightData =
    chart.highlightIncome !== 0 ||
    chart.highlightExpense !== 0 ||
    chart.highlightBalance !== 0

  return (
    <div className="relative flex min-h-[280px] w-full flex-col rounded-3xl bg-white px-4 pb-4 pt-6 shadow-sm sm:px-6 md:min-h-[340px] lg:min-h-[420px] xl:min-h-[500px]">
      <div className="flex min-h-0 flex-1">
        <div className="mr-2 flex w-12 shrink-0 flex-col justify-between pb-6 pt-1 sm:mr-4 sm:w-14">
          {chart.yLabels.map((label, index) => (
            <span key={index} className="text-[10px] text-finance-muted sm:text-[11px]">
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

            {incomePath && (
              <path
                d={incomePath}
                fill="none"
                stroke={financeColors.primary}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {expensePath && (
              <path
                d={expensePath}
                fill="none"
                stroke={financeColors.secondary}
                strokeWidth="2"
                strokeDasharray="6 6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {balancePath && (
              <path
                d={balancePath}
                fill="none"
                stroke={financeColors.balance}
                strokeWidth="2"
                strokeDasharray="3 4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {chart.showPointMarker && highlight && hasHighlightData && (
              <>
                <circle cx={highlight.x} cy={highlight.y} r="5" fill={financeColors.primary} />
                <line
                  x1={highlight.x}
                  y1={highlight.y + 5}
                  x2={highlight.x}
                  y2={CHART_HEIGHT - 12}
                  stroke={financeColors.border}
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
              </>
            )}
          </svg>

          {hasHighlightData && (
            <div
              className={`absolute top-[2%] ${
                chart.showPointMarker
                  ? tooltipAlignClass(chart.highlightIndex, flowPoints.length)
                  : "-translate-x-1/2"
              }`}
              style={{ left: `${chart.highlightXPercent}%` }}
            >
              <div
                className="whitespace-nowrap rounded-2xl px-3 py-1.5 text-center shadow-sm sm:px-4 sm:py-2"
                style={{ backgroundColor: financeColors.primaryDark }}
              >
                <p className="text-[10px] text-white/80 sm:text-[11px]">{chart.highlightLabel}</p>
                <p className="text-xs font-bold text-white sm:text-sm">
                  Rec. {formatBRL(chart.highlightIncome)}
                </p>
                <p className="text-xs font-bold text-white/90 sm:text-sm">
                  Desp. {formatBRL(chart.highlightExpense)}
                </p>
                <p className="text-xs font-bold text-white sm:text-sm">
                  Saldo {formatBRL(chart.highlightBalance)}
                </p>
              </div>
            </div>
          )}

          <div
            className="absolute bottom-0 left-0 right-0"
            style={{ paddingLeft: `${xPadPercent}%`, paddingRight: `${xPadPercent}%` }}
          >
            <div className="flex justify-between gap-0.5">
              {flowPoints.map((point, index) => (
                <span
                  key={point.date}
                  className="min-w-0 flex-1 truncate text-center text-[9px] text-finance-muted sm:text-[10px] md:text-[11px]"
                  title={point.label}
                >
                  {shouldShowXLabel(index, flowPoints.length, period) ? (
                    <>
                      <span className="lg:hidden">{shortLabel(point.label, period)}</span>
                      <span className="hidden lg:inline">{point.label}</span>
                    </>
                  ) : (
                    <span aria-hidden className="invisible">
                      ·
                    </span>
                  )}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
