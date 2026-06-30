import { StyleSheet, Text, View } from "@react-pdf/renderer"
import { financeColors, financeText } from "@/components/finance/theme"

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: financeText.heading,
    marginTop: 18,
    marginBottom: 10,
  },
  box: {
    backgroundColor: financeColors.lightBg,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: financeColors.border,
  },
  item: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  bullet: {
    fontSize: 9,
    color: financeColors.primary,
    fontWeight: "bold",
  },
  text: {
    fontSize: 9,
    color: financeText.body,
    lineHeight: 1.45,
    flex: 1,
  },
})

type ReportInsightsProps = {
  insights: string[]
}

export function ReportInsights({ insights }: ReportInsightsProps) {
  return (
    <View wrap={false}>
      <Text style={styles.sectionTitle}>Análise Financeira</Text>
      <View style={styles.box}>
        {insights.map((insight) => (
          <View key={insight} style={styles.item}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.text}>{insight}</Text>
          </View>
        ))}
      </View>
    </View>
  )
}
