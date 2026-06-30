import { StyleSheet, Text, View } from "@react-pdf/renderer"
import { financeColors, financeText } from "@/components/finance/theme"
import { SYSTEM_NAME } from "@/lib/finance/clinic-branding"

const styles = StyleSheet.create({
  footer: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: financeColors.border,
    paddingTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  text: {
    fontSize: 8,
    color: financeText.muted,
  },
})

type ReportFooterProps = {
  clinicName: string
  issuedAt: Date
}

function formatFooterDate(date: Date): string {
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

export function ReportFooter({ clinicName, issuedAt }: ReportFooterProps) {
  return (
    <View style={styles.footer} fixed>
      <Text style={styles.text}>{clinicName}</Text>
      <Text style={styles.text}>{SYSTEM_NAME}</Text>
      <Text
        style={styles.text}
        render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`}
      />
      <Text style={styles.text}>{formatFooterDate(issuedAt)}</Text>
    </View>
  )
}
