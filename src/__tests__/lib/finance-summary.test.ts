// @vitest-environment node
import { summarizeTransactions, formatBRL, getTotalExpenses } from "@/lib/finance/summary"
import {
  TransactionStatus,
  TransactionType,
  type FinanceTransaction,
} from "@/lib/finance/types"

function tx(overrides: Partial<FinanceTransaction>): FinanceTransaction {
  return {
    id: 1,
    type: TransactionType.Income,
    category: "Consulta",
    description: "teste",
    amount: 100,
    date: "2026-06-01",
    status: TransactionStatus.Confirmed,
    ...overrides,
  }
}

describe("summarizeTransactions", () => {
  it("soma receitas e despesas confirmadas e calcula saldo e comissão", () => {
    const transactions = [
      tx({ id: 1, type: TransactionType.Income, amount: 200 }),
      tx({ id: 2, type: TransactionType.Income, amount: 100 }),
      tx({ id: 3, type: TransactionType.Expense, amount: 50 }),
    ]

    const summary = summarizeTransactions(transactions, 40)

    expect(summary.totalIncome).toBe(300)
    expect(summary.expenseFromTransactions).toBe(50)
    expect(summary.totalExpense).toBe(170)
    expect(summary.balance).toBe(130)
    expect(summary.commission).toBe(120)
    expect(getTotalExpenses(summary)).toBe(170)
  })

  it("ignora transações pendentes ou canceladas", () => {
    const transactions = [
      tx({ id: 1, type: TransactionType.Income, amount: 100, status: TransactionStatus.Confirmed }),
      tx({ id: 2, type: TransactionType.Income, amount: 999, status: TransactionStatus.Pending }),
      tx({ id: 3, type: TransactionType.Expense, amount: 999, status: TransactionStatus.Cancelled }),
    ]

    const summary = summarizeTransactions(transactions, 10)

    expect(summary.totalIncome).toBe(100)
    expect(summary.expenseFromTransactions).toBe(0)
    expect(summary.totalExpense).toBe(10)
    expect(summary.commission).toBe(10)
    expect(getTotalExpenses(summary)).toBe(10)
  })

  it("retorna zeros para lista vazia", () => {
    expect(summarizeTransactions([], 40)).toEqual({
      totalIncome: 0,
      expenseFromTransactions: 0,
      commission: 0,
      totalExpense: 0,
      balance: 0,
    })
  })
})

describe("formatBRL", () => {
  it("formata em reais (pt-BR)", () => {
    expect(formatBRL(1234.5)).toBe("R$ 1.234,50")
  })
})
