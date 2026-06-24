"use client"

import { CirclePlus, Loader2 } from "lucide-react"
import { financeColors } from "@/components/finance/theme"
import { formatBRL } from "@/lib/finance/summary"
import { Sparkline } from "./shared/Sparkline"
import { Button } from "../ui/button"

type MyCardProps = {
  balance: number
  isLoading?: boolean
  onNewTransaction?: () => void
}

export function MyCard({ balance, isLoading, onNewTransaction }: MyCardProps) {
  return (
    <div
      className="flex min-h-0 flex-col gap-4 rounded-3xl p-5 sm:min-h-[140px] sm:flex-row sm:items-stretch sm:justify-between sm:gap-0 sm:p-6 lg:min-h-[170px] lg:p-8"
      style={{ background: financeColors.cardGradient }}
    >
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
          <span className="text-sm font-semibold" style={{ color: financeColors.lightAccent }}>
            + 10%
          </span>
          <Sparkline color={financeColors.lightAccent} variant="line" className="h-8 w-[88px]" />
        </div>

        <div className="flex flex-wrap items-center">
          <Button
            className="px-6 py-4 items-center gap-2 rounded-full bg-white text-base font-semibold text-finance-body hover:bg-white/80"
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
