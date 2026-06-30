import { StyleSheet, Text, View, Image } from "@react-pdf/renderer"
import { financeText } from "@/components/finance/theme"
import type { FinancialReportChartImages } from "@/lib/finance/report-types"

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: financeText.heading,
    marginTop: 18,
    marginBottom: 10,
  },
  chartBlock: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
    padding: 10,
  },
  chartTitle: {
    fontSize: 10,
    fontWeight: "bold",
    color: financeText.heading,
    marginBottom: 6,
  },
  chartImage: {
    width: "100%",
    objectFit: "contain",
    borderRadius: 8,
  },
  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 6,
    marginBottom: 4,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendText: {
    fontSize: 8,
    color: financeText.body,
  },
  description: {
    fontSize: 8,
    color: financeText.muted,
    marginTop: 4,
    lineHeight: 1.35,
  },
})

type ChartEntryProps = {
  title: string
  imageSrc: string
  legend: { color: string; label: string }[]
  description: string
}

function ChartEntry({ title, imageSrc, legend, description }: ChartEntryProps) {
  return (
    <View style={styles.chartBlock} wrap={false}>
      <Text style={styles.chartTitle}>{title}</Text>
      <Image src={imageSrc} style={styles.chartImage} />
      <View style={styles.legend}>
        {legend.map((item) => (
          <View key={item.label} style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: item.color }]} />
            <Text style={styles.legendText}>{item.label}</Text>
          </View>
        ))}
      </View>
      <Text style={styles.description}>{description}</Text>
    </View>
  )
}

type ReportChartsProps = {
  charts: FinancialReportChartImages
}

export function ReportCharts({ charts }: ReportChartsProps) {
  return (
    <View>
      <Text style={styles.sectionTitle}>Gráficos</Text>

      <ChartEntry
        title="Fluxo de Caixa"
        imageSrc={charts.moneyFlow}
        legend={[
          { color: "#9747FF", label: "Receita" },
          { color: "#766889", label: "Despesa" },
          { color: "#0D9488", label: "Saldo" },
        ]}
        description="Evolução das entradas, saídas e saldo acumulado no período selecionado."
      />

    </View>
  )
}
