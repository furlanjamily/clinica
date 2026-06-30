import { Document, Page, StyleSheet, View } from "@react-pdf/renderer"
import type { FinancialReportPayload } from "@/lib/finance/report-types"
import { ReportHeader } from "./ReportHeader"
import { ReportSummary } from "./ReportSummary"
import { ReportIndicators } from "./ReportIndicators"
import { ReportCharts } from "./ReportCharts"
import { ReportInsights } from "./ReportInsights"
import { ReportFooter } from "./ReportFooter"

const styles = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingBottom: 52,
    paddingHorizontal: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
    backgroundColor: "#FFFFFF",
    color: "#52525B",
  },
})

type FinancialReportPDFProps = {
  data: FinancialReportPayload
}

export function FinancialReportPDF({ data }: FinancialReportPDFProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <ReportHeader data={data} />
        <ReportSummary metrics={data.metrics} />
        <ReportIndicators metrics={data.metrics} />
        <ReportInsights insights={data.insights} />
        <ReportFooter clinicName={data.clinicName} issuedAt={data.issuedAt} />
      </Page>

      <Page size="A4" style={styles.page}>
        <ReportCharts charts={data.charts} />
        <ReportFooter clinicName={data.clinicName} issuedAt={data.issuedAt} />
      </Page>
    </Document>
  )
}
