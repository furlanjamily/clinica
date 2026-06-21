// @vitest-environment node
import { summarizeTransactions, formatBRL } from "@/lib/finance/summary"
import type { FinanceTransaction } from "@/lib/finance/types"

function tx(overrides: Partial<FinanceTransaction>): FinanceTransaction {
  return {
    id: 1,
    type: "Receita",
    category: "Consulta",
    description: "teste",
    amount: 100,
    date: "2026-06-01",
    status: "Confirmado",
    ...overrides,
  }
}

describe("summarizeTransactions", () => {
  it("soma receitas e despesas confirmadas e calcula saldo e comissão", () => {
    const transactions = [
      tx({ id: 1, type: "Receita", amount: 200 }),
      tx({ id: 2, type: "Receita", amount: 100 }),
      tx({ id: 3, type: "Despesa", amount: 50 }),
    ]

    const summary = summarizeTransactions(transactions, 40)

    expect(summary.totalIncome).toBe(300)
    expect(summary.totalExpense).toBe(50)
    expect(summary.balance).toBe(250)
    expect(summary.commission).toBe(120) // 40% de 300
  })

  it("ignora transações pendentes ou canceladas", () => {
    const transactions = [
      tx({ id: 1, type: "Receita", amount: 100, status: "Confirmado" }),
      tx({ id: 2, type: "Receita", amount: 999, status: "Pendente" }),
      tx({ id: 3, type: "Despesa", amount: 999, status: "Cancelado" }),
    ]

    const summary = summarizeTransactions(transactions, 10)

    expect(summary.totalIncome).toBe(100)
    expect(summary.totalExpense).toBe(0)
    expect(summary.commission).toBe(10)
  })

  it("retorna zeros para lista vazia", () => {
    expect(summarizeTransactions([], 40)).toEqual({
      totalIncome: 0,
      totalExpense: 0,
      balance: 0,
      commission: 0,
    })
  })
})

describe("formatBRL", () => {
  it("formata em reais (pt-BR)", () => {
    // \u00a0 = espaço não separável usado pelo Intl
    expect(formatBRL(1234.5).replace(/\u00a0/g, " ")).toBe("R$ 1.234,50")
  })
})
