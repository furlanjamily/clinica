import { formatBRL, getTotalExpenses } from "./summary"
import type { FinancialReportMetrics } from "./report-types"

function expenseShareOfRevenue(metrics: FinancialReportMetrics): number {
  if (metrics.current.totalIncome <= 0) return 0
  return Math.round(
    (getTotalExpenses(metrics.current) / metrics.current.totalIncome) * 100
  )
}

function commissionShareOfRevenue(metrics: FinancialReportMetrics): number {
  if (metrics.current.totalIncome <= 0) return 0
  return Math.round((metrics.current.commission / metrics.current.totalIncome) * 100)
}

/** Gera análises executivas objetivas a partir dos dados do período. */
export function buildFinancialReportInsights(metrics: FinancialReportMetrics): string[] {
  const insights: string[] = []

  if (metrics.incomeChangeDirection === "up") {
    insights.push("A receita apresentou crescimento em relação ao período anterior.")
  } else if (metrics.incomeChangeDirection === "down") {
    insights.push("A receita registrou redução em relação ao período anterior.")
  } else {
    insights.push("A receita manteve-se estável em relação ao período anterior.")
  }

  const expenseShare = expenseShareOfRevenue(metrics)
  if (metrics.current.totalIncome > 0) {
    insights.push(
      `As despesas totais representam ${expenseShare}% do faturamento do período.`
    )
  }

  const commissionShare = commissionShareOfRevenue(metrics)
  if (metrics.current.commission > 0) {
    if (commissionShare <= 45) {
      insights.push("A comissão médica permaneceu dentro do patamar esperado.")
    } else {
      insights.push(
        `A comissão médica corresponde a ${commissionShare}% da receita do período.`
      )
    }
  } else {
    insights.push("Não houve comissão médica registrada no período analisado.")
  }

  if (metrics.balanceChangeDirection === "neutral") {
    insights.push("O fluxo de caixa apresentou estabilidade no período.")
  } else if (Math.abs(metrics.current.balance - metrics.previous.balance) < metrics.current.totalIncome * 0.05) {
    insights.push("O fluxo de caixa apresentou variação moderada no período.")
  } else {
    insights.push(
      metrics.balanceChangeDirection === "up"
        ? "O fluxo de caixa apresentou melhora em relação ao período anterior."
        : "O fluxo de caixa apresentou retração em relação ao período anterior."
    )
  }

  if (metrics.netProfit > 0) {
    insights.push(
      `O saldo final do período foi positivo, totalizando ${formatBRL(metrics.netProfit)}.`
    )
  } else if (metrics.netProfit < 0) {
    insights.push(
      `O saldo final do período foi negativo, totalizando ${formatBRL(metrics.netProfit)}.`
    )
  } else {
    insights.push("O saldo final do período encerrou em equilíbrio (R$ 0,00).")
  }

  return insights.slice(0, 5)
}
