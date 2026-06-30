"use client"

import { useCallback, useState } from "react"
import { useSession } from "next-auth/react"
import { generateFinancialReportPdf } from "@/lib/finance/pdf-generator"
import type { RecordPeriod } from "@/lib/finance/period-filter"
import type { FinanceTransaction } from "@/lib/finance/types"
import { toast } from "sonner"

type UseFinanceReportGeneratorOptions = {
  transactions: FinanceTransaction[]
  period: RecordPeriod
  commissionRate: number
  isDataReady: boolean
}

export function useFinanceReportGenerator({
  transactions,
  period,
  commissionRate,
  isDataReady,
}: UseFinanceReportGeneratorOptions) {
  const { data: session } = useSession()
  const [isGenerating, setIsGenerating] = useState(false)

  const generateReport = useCallback(async () => {
    if (!isDataReady) {
      toast.error("Aguarde o carregamento dos dados financeiros.")
      return
    }

    setIsGenerating(true)
    try {
      const issuedBy =
        session?.user?.username ?? session?.user?.name ?? session?.user?.email ?? "Usuário"

      await generateFinancialReportPdf({
        transactions,
        period,
        commissionRate,
        issuedBy,
      })
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Não foi possível gerar o relatório."
      toast.error(message)
    } finally {
      setIsGenerating(false)
    }
  }, [commissionRate, isDataReady, period, session, transactions])

  return { generateReport, isGenerating }
}
