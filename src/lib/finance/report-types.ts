import type { RecordPeriod } from "./period-filter"
import type { FinanceSummary } from "./summary"

export type FinancialReportChartImages = {
  moneyFlow: string
  commission: string
}

export type FinancialReportMetrics = {
  current: FinanceSummary
  previous: FinanceSummary
  netProfit: number
  financialMargin: number
  averageTicket: number
  averageRevenuePerAppointment: number
  incomeCount: number
  expenseCount: number
  growthPercent: number
  reductionPercent: number
  balanceChangePercent: string
  balanceChangeDirection: "up" | "down" | "neutral"
  incomeChangePercent: string
  incomeChangeDirection: "up" | "down" | "neutral"
  expenseChangePercent: string
  expenseChangeDirection: "up" | "down" | "neutral"
  commissionChangePercent: string
  commissionChangeDirection: "up" | "down" | "neutral"
}

export type FinancialReportPayload = {
  clinicName: string
  clinicLogoDataUrl: string
  period: RecordPeriod
  periodLabel: string
  referenceDate: string
  issuedAt: Date
  issuedBy: string
  metrics: FinancialReportMetrics
  insights: string[]
  charts: FinancialReportChartImages
}
