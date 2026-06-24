import {
  TransactionStatus,
  TransactionType,
  type FinanceTransaction,
} from "./types"

export type FinanceSummary = {
  totalIncome: number
  expenseFromTransactions: number
  commission: number
  totalExpense: number
  balance: number
}

const sumAmounts = (transactions: FinanceTransaction[]) =>
  transactions.reduce((acc, transaction) => acc + transaction.amount, 0)

export function calculateCommission(totalIncome: number, commissionRate: number): number {
  const rate = Number(commissionRate)
  const safeRate = Number.isFinite(rate) ? rate : 0
  return totalIncome * (safeRate / 100)
}

/**
 * Resumo financeiro do período: considera apenas transações confirmadas.
 * `commissionRate` é o percentual (0–100) repassado aos médicos.
 */
export function summarizeTransactions(
  transactions: FinanceTransaction[],
  commissionRate: number
): FinanceSummary {
  const confirmed = transactions.filter(
    (transaction) => transaction.status === TransactionStatus.Confirmed
  )

  const totalIncome = sumAmounts(
    confirmed.filter((transaction) => transaction.type === TransactionType.Income)
  )
  const expenseFromTransactions = sumAmounts(
    confirmed.filter((transaction) => transaction.type === TransactionType.Expense)
  )
  const commission = calculateCommission(totalIncome, commissionRate)
  const totalExpense = expenseFromTransactions + commission

  return {
    totalIncome,
    expenseFromTransactions,
    commission,
    totalExpense,
    balance: totalIncome - totalExpense,
  }
}

export function getTotalExpenses(summary: FinanceSummary): number {
  return summary.expenseFromTransactions + summary.commission
}

export function formatBRL(value: number): string {
  return value
    .toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
    .replace(/\u00a0/g, " ")
}
