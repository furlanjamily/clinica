import { StyleSheet, Text, View } from "@react-pdf/renderer"
import { financeColors, financeText } from "@/components/finance/theme"
import { formatBRL } from "@/lib/finance/summary"
import type { FinancialReportMetrics } from "@/lib/finance/report-types"

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: financeText.heading,
    marginTop: 18,
    marginBottom: 10,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  card: {
    width: "23%",
    minWidth: 115,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: financeColors.border,
    borderRadius: 10,
    padding: 10,
  },
  label: {
    fontSize: 8,
    color: financeText.muted,
    marginBottom: 4,
  },
  value: {
    fontSize: 11,
    fontWeight: "bold",
    color: financeText.heading,
  },
})

type IndicatorProps = {
  label: string
  value: string
}

function Indicator({ label, value }: IndicatorProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  )
}

type ReportIndicatorsProps = {
  metrics: FinancialReportMetrics
}

export function ReportIndicators({ metrics }: ReportIndicatorsProps) {
  const growthLabel =
    metrics.growthPercent > 0 ? `${metrics.growthPercent}%` : "0%"
  const reductionLabel =
    metrics.reductionPercent > 0 ? `${metrics.reductionPercent}%` : "0%"

  return (
    <View wrap={false}>
      <Text style={styles.sectionTitle}>Indicadores Financeiros</Text>
      <View style={styles.grid}>
        <Indicator
          label="Receita Média por Atendimento"
          value={formatBRL(metrics.averageRevenuePerAppointment)}
        />
        <Indicator label="Quantidade de Receitas" value={String(metrics.incomeCount)} />
        <Indicator label="Quantidade de Despesas" value={String(metrics.expenseCount)} />
        <Indicator label="Percentual de Crescimento" value={growthLabel} />
        <Indicator label="Percentual de Redução" value={reductionLabel} />
      </View>
    </View>
  )
}
