import { getTodayYYYYMMDD } from "@/lib/time/tz-date"
import {
  filterTransactionsByPeriod,
  filterTransactionsByPreviousPeriod,
  formatPercentChange,
  getPercentDirection,
  type RecordPeriod,
} from "./period-filter"
import { getTotalExpenses, summarizeTransactions } from "./summary"
import { TransactionStatus, TransactionType, type FinanceTransaction } from "./types"
import type { FinancialReportMetrics } from "./report-types"

function countConfirmedByType(
  transactions: FinanceTransaction[],
  type: FinanceTransaction["type"]
): number {
  return transactions.filter(
    (t) => t.status === TransactionStatus.Confirmed && t.type === type
  ).length
}

function percentDelta(current: number, previous: number): number {
  if (previous === 0) return current === 0 ? 0 : 100
  return Math.round(((current - previous) / previous) * 100)
}

export function buildFinancialReportMetrics(
  transactions: FinanceTransaction[],
  period: RecordPeriod,
  commissionRate: number,
  referenceDate = getTodayYYYYMMDD()
): FinancialReportMetrics {
  const periodTxs = filterTransactionsByPeriod(transactions, period, referenceDate)
  const prevTxs = filterTransactionsByPreviousPeriod(transactions, period, referenceDate)

  const current = summarizeTransactions(periodTxs, commissionRate)
  const previous = summarizeTransactions(prevTxs, commissionRate)

  const incomeCount = countConfirmedByType(periodTxs, TransactionType.Income)
  const expenseCount = countConfirmedByType(periodTxs, TransactionType.Expense)

  const netProfit = current.balance
  const financialMargin =
    current.totalIncome > 0 ? (netProfit / current.totalIncome) * 100 : 0
  const averageTicket = incomeCount > 0 ? current.totalIncome / incomeCount : 0

  const incomeGrowth = percentDelta(current.totalIncome, previous.totalIncome)
  const expenseGrowth = percentDelta(
    getTotalExpenses(current),
    getTotalExpenses(previous)
  )

  return {
    current,
    previous,
    netProfit,
    financialMargin,
    averageTicket,
    averageRevenuePerAppointment: averageTicket,
    incomeCount,
    expenseCount,
    growthPercent: Math.max(0, incomeGrowth),
    reductionPercent: Math.max(0, -expenseGrowth),
    balanceChangePercent: formatPercentChange(current.balance, previous.balance),
    balanceChangeDirection: getPercentDirection(current.balance, previous.balance),
    incomeChangePercent: formatPercentChange(current.totalIncome, previous.totalIncome),
    incomeChangeDirection: getPercentDirection(current.totalIncome, previous.totalIncome),
    expenseChangePercent: formatPercentChange(
      getTotalExpenses(current),
      getTotalExpenses(previous)
    ),
    expenseChangeDirection: getPercentDirection(
      getTotalExpenses(current),
      getTotalExpenses(previous)
    ),
    commissionChangePercent: formatPercentChange(current.commission, previous.commission),
    commissionChangeDirection: getPercentDirection(current.commission, previous.commission),
  }
}
