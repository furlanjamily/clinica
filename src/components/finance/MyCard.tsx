"use client"

import { CirclePlus, Loader2 } from "lucide-react"
import { financeColors } from "@/components/finance/theme"
import {
  formatPercentChange,
  getPercentDirection,
} from "@/lib/finance/period-filter"
import { formatBRL } from "@/lib/finance/summary"
import { cn } from "@/lib/utils"
import { Sparkline } from "./shared/Sparkline"
import { Button } from "../ui/button"

const TREND_TEXT_CLASS = {
  up: "text-finance-light-accent",
  down: "text-rose-200",
  neutral: "text-white/75",
} as const

const TREND_SPARKLINE_COLOR = {
  up: financeColors.lightAccent,
  down: "#FECDD3",
  neutral: "rgba(255,255,255,0.75)",
} as const

type MyCardProps = {
  balance: number
  previousBalance: number
  isLoading?: boolean
  onNewTransaction?: () => void
}

function formatSignedPercentLabel(current: number, previous: number): string {
  const direction = getPercentDirection(current, previous)
  const percent = formatPercentChange(current, previous)

  if (direction === "neutral") return percent
  const sign = direction === "up" ? "+ " : "- "
  return `${sign}${percent}`
}

export function MyCard({
  balance,
  previousBalance,
  isLoading,
  onNewTransaction,
}: MyCardProps) {
  const percentDirection = getPercentDirection(balance, previousBalance)
  const percentLabel = formatSignedPercentLabel(balance, previousBalance)

  return (
    <div className="flex min-h-0 flex-col gap-4 rounded-3xl bg-finance-card-gradient p-5 sm:min-h-[140px] sm:flex-row sm:items-stretch sm:justify-between sm:gap-0 sm:p-6 lg:min-h-[170px] lg:p-8">
      <div className="flex flex-col justify-between">
        <h2 className="text-lg font-semibold text-white">Saldo</h2>
        <div className="mt-4 flex min-h-[36px] items-center sm:min-h-[44px]">
          {isLoading ? (
            <Loader2
              className="h-9 w-9 animate-spin text-white/90 sm:h-11 sm:w-11"
              strokeWidth={2}
              aria-label="Carregando saldo"
            />
          ) : (
            <p className="text-3xl font-bold leading-none tracking-tight text-white sm:text-[44px]">
              {formatBRL(balance)}
            </p>
          )}
        </div>
      </div>
      <div className="flex flex-col items-start justify-between gap-4 sm:items-end">
        <div className="flex flex-col items-end gap-1">
          {isLoading ? (
            <span className="inline-block h-5 w-16 animate-pulse rounded bg-white/20" />
          ) : (
            <span className={cn("text-sm font-semibold", TREND_TEXT_CLASS[percentDirection])}>
              {percentLabel}
            </span>
          )}
          <Sparkline
            color={TREND_SPARKLINE_COLOR[percentDirection]}
            variant="line"
            trend={percentDirection}
            className="h-8 w-[88px]"
          />
        </div>

        <div className="flex flex-wrap items-center">
          <Button
            className="items-center gap-2 rounded-full bg-white px-6 py-4 text-base font-semibold text-finance-body hover:bg-white/80"
            size="lg"
            onClick={onNewTransaction}
          >
            <CirclePlus size={24} strokeWidth={2.5} />
            <span>Nova Transação</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
