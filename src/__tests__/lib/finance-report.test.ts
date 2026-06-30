// @vitest-environment node
import { buildFinancialReportMetrics } from "@/lib/finance/report-data"
import { buildFinancialReportInsights } from "@/lib/finance/report-insights"
import {
  buildFinancialReportFilename,
  formatReportPeriodLabel,
} from "@/lib/finance/report-period-label"
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
    date: "2026-06-15",
    status: TransactionStatus.Confirmed,
    ...overrides,
  }
}

describe("buildFinancialReportMetrics", () => {
  it("calcula indicadores do período mensal", () => {
    const transactions = [
      tx({ id: 1, amount: 200, date: "2026-06-10" }),
      tx({ id: 2, amount: 100, date: "2026-06-20" }),
      tx({ id: 3, type: TransactionType.Expense, amount: 50, date: "2026-06-12" }),
      tx({ id: 4, amount: 500, date: "2026-05-10" }),
    ]

    const metrics = buildFinancialReportMetrics(transactions, "mes", 10, "2026-06-29")

    expect(metrics.current.totalIncome).toBe(300)
    expect(metrics.incomeCount).toBe(2)
    expect(metrics.expenseCount).toBe(1)
    expect(metrics.averageTicket).toBe(150)
    expect(metrics.netProfit).toBe(220)
  })
})

describe("buildFinancialReportInsights", () => {
  it("gera textos executivos a partir das métricas", () => {
    const metrics = buildFinancialReportMetrics(
      [tx({ amount: 200 }), tx({ id: 2, type: TransactionType.Expense, amount: 40 })],
      "mes",
      10,
      "2026-06-29"
    )

    const insights = buildFinancialReportInsights(metrics)

    expect(insights.length).toBeGreaterThan(0)
    expect(insights.some((item) => item.includes("receita"))).toBe(true)
  })
})

describe("report period labels", () => {
  it("formata rótulo e nome de arquivo por período", () => {
    expect(formatReportPeriodLabel("hoje", "2026-06-29")).toBe("29/06/2026")
    expect(formatReportPeriodLabel("mes", "2026-06-29")).toBe("Junho de 2026")
    expect(buildFinancialReportFilename("hoje", "2026-06-29")).toBe(
      "Relatorio_Financeiro_Dia_2026-06-29.pdf"
    )
    expect(buildFinancialReportFilename("mes", "2026-06-29")).toBe(
      "Relatorio_Financeiro_Junho_2026.pdf"
    )
    expect(buildFinancialReportFilename("ano", "2026-06-29")).toBe(
      "Relatorio_Financeiro_2026.pdf"
    )
  })
})
