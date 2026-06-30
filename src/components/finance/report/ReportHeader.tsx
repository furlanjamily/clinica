import { StyleSheet, Text, View, Image } from "@react-pdf/renderer"
import { financeColors, financeText } from "@/components/finance/theme"
import type { FinancialReportPayload } from "@/lib/finance/report-types"
import { SYSTEM_NAME } from "@/lib/finance/clinic-branding"

const styles = StyleSheet.create({
  header: {
    marginBottom: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: financeColors.border,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  logo: {
    width: 88,
    height: 18,
    objectFit: "contain",
  },
  clinicName: {
    fontSize: 11,
    color: financeText.muted,
    marginTop: 4,
  },
  titleBlock: {
    alignItems: "flex-end",
    maxWidth: 220,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: financeColors.primaryDark,
  },
  subtitle: {
    fontSize: 10,
    color: financeText.body,
    marginTop: 4,
  },
  meta: {
    fontSize: 9,
    color: financeText.muted,
    marginTop: 2,
    textAlign: "right",
  },
})

function formatIssuedAt(date: Date): string {
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

type ReportHeaderProps = {
  data: FinancialReportPayload
}

export function ReportHeader({ data }: ReportHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.row}>
        <View style={styles.brandRow}>
          {data.clinicLogoDataUrl ? (
            <Image src={data.clinicLogoDataUrl} style={styles.logo} />
          ) : null}
          <View>
          </View>
        </View>

        <View style={styles.titleBlock}>
          <Text style={styles.title}>Relatório Financeiro</Text>
          <Text style={styles.subtitle}>Período: {data.periodLabel}</Text>
          <Text style={styles.meta}>Emissão: {formatIssuedAt(data.issuedAt)}</Text>
          <Text style={styles.meta}>Responsável: {data.issuedBy}</Text>
        </View>
      </View>
    </View>
  )
}
