import { StyleSheet, Text, View } from "@react-pdf/renderer"
import { financeColors, financeText } from "@/components/finance/theme"
import { formatBRL, getTotalExpenses } from "@/lib/finance/summary"
import type { FinancialReportMetrics } from "@/lib/finance/report-types"

const CARD_VARIANTS = {
  balance: { bg: financeColors.primaryDark, accent: "#E9D5FF", text: "#FFFFFF" },
  income: { bg: financeColors.lightBg, accent: financeColors.primary, text: financeText.heading },
  expense: { bg: financeColors.secondaryBg, accent: financeColors.secondary, text: financeText.heading },
  commission: { bg: financeColors.savingBg, accent: financeColors.primaryHover, text: financeText.heading },
  profit: { bg: "#ECFDF5", accent: financeColors.balance, text: financeText.heading },
  margin: { bg: "#FAFAFA", accent: financeColors.primary, text: financeText.heading },
} as const

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: financeText.heading,
    marginBottom: 10,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  card: {
    width: "31.5%",
    minWidth: 150,
    borderRadius: 12,
    padding: 12,
    minHeight: 88,
  },
  label: {
    fontSize: 9,
    marginBottom: 4,
  },
  value: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 3,
  },
  percent: {
    fontSize: 8,
    fontWeight: "bold",
  },
  description: {
    fontSize: 7,
    marginTop: 4,
    opacity: 0.85,
  },
})

function trendArrow(direction: "up" | "down" | "neutral"): string {
  if (direction === "down") return "↓"
  if (direction === "up") return "↑"
  return "•"
}

type SummaryCardProps = {
  variant: keyof typeof CARD_VARIANTS
  label: string
  value: string
  percent?: string
  direction?: "up" | "down" | "neutral"
  description: string
}

function SummaryCard({
  variant,
  label,
  value,
  percent,
  direction = "neutral",
  description,
}: SummaryCardProps) {
  const palette = CARD_VARIANTS[variant]
  const isDark = variant === "balance"

  return (
    <View style={[styles.card, { backgroundColor: palette.bg }]}>
      <Text style={[styles.label, { color: isDark ? "rgba(255,255,255,0.85)" : financeText.body }]}>
        {label}
      </Text>
      <Text style={[styles.value, { color: isDark ? "#FFFFFF" : palette.text }]}>{value}</Text>
      {percent && direction !== "neutral" ? (
        <Text style={[styles.percent, { color: palette.accent }]}>
          {trendArrow(direction)} {percent}
        </Text>
      ) : null}
      <Text
        style={[
          styles.description,
          { color: isDark ? "rgba(255,255,255,0.75)" : financeText.muted },
        ]}
      >
        {description}
      </Text>
    </View>
  )
}

type ReportSummaryProps = {
  metrics: FinancialReportMetrics
}

export function ReportSummary({ metrics }: ReportSummaryProps) {
  const totalExpense = getTotalExpenses(metrics.current)
  const marginLabel = `${metrics.financialMargin.toFixed(1).replace(".", ",")}%`

  return (
    <View wrap={false}>
      <Text style={styles.sectionTitle}>Resumo Executivo</Text>
      <View style={styles.grid}>
        <SummaryCard
          variant="balance"
          label="lucro Líquido"
          value={formatBRL(metrics.current.balance)}
          percent={metrics.balanceChangePercent}
          direction={metrics.balanceChangeDirection}
          description="Resultado líquido do período filtrado"
        />
        <SummaryCard
          variant="income"
          label="Receita Total"
          value={formatBRL(metrics.current.totalIncome)}
          percent={metrics.incomeChangePercent}
          direction={metrics.incomeChangeDirection}
          description="Entradas confirmadas no período"
        />
        <SummaryCard
          variant="expense"
          label="Despesas Totais"
          value={formatBRL(totalExpense)}
          percent={metrics.expenseChangePercent}
          direction={metrics.expenseChangeDirection}
          description="Despesas operacionais e comissões"
        />
        <SummaryCard
          variant="commission"
          label="Comissão Médica"
          value={formatBRL(metrics.current.commission)}
          percent={metrics.commissionChangePercent}
          direction={metrics.commissionChangeDirection}
          description="Repasse aos profissionais"
        />
        <SummaryCard
          variant="margin"
          label="Margem Financeira"
          value={marginLabel}
          description="Proporção do Lucro Líquido sobre a Receita Total"
        />
      </View>
    </View>
  )
}
