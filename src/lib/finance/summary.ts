import type { FinanceTransaction } from "./types"

export type FinanceSummary = {
  totalIncome: number
  totalExpense: number
  balance: number
  /** Comissão dos médicos calculada sobre as receitas confirmadas. */
  commission: number
}

const sumAmounts = (transactions: FinanceTransaction[]) =>
  transactions.reduce((acc, t) => acc + t.amount, 0)

/**
 * Resumo financeiro do período: considera apenas transações confirmadas.
 * `commissionRate` é o percentual (0–100) repassado aos médicos.
 */
export function summarizeTransactions(
  transactions: FinanceTransaction[],
  commissionRate: number
): FinanceSummary {
  const confirmed = transactions.filter((t) => t.status === "Confirmado")

  const totalIncome = sumAmounts(confirmed.filter((t) => t.type === "Receita"))
  const totalExpense = sumAmounts(confirmed.filter((t) => t.type === "Despesa"))

  return {
    totalIncome,
    totalExpense,
    balance: totalIncome - totalExpense,
    commission: totalIncome * (commissionRate / 100),
  }
}

export function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}
