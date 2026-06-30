import { toast } from "sonner"
import { CLINIC_LOGO_PATH, CLINIC_NAME } from "@/lib/finance/clinic-branding"
import {
  captureElementAsImage,
  fetchImageAsDataUrl,
  waitForChartPaint,
} from "@/lib/finance/capture-chart"
import { buildFinancialReportMetrics } from "@/lib/finance/report-data"
import { buildFinancialReportInsights } from "@/lib/finance/report-insights"
import {
  buildFinancialReportFilename,
  formatReportPeriodLabel,
} from "@/lib/finance/report-period-label"
import type { FinancialReportPayload } from "@/lib/finance/report-types"
import type { RecordPeriod } from "@/lib/finance/period-filter"
import type { FinanceTransaction } from "@/lib/finance/types"
import { getTodayYYYYMMDD } from "@/lib/time/tz-date"

export type GenerateFinancialReportInput = {
  transactions: FinanceTransaction[]
  period: RecordPeriod
  commissionRate: number
  issuedBy: string
  referenceDate?: string
}

async function captureReportCharts(): Promise<{ moneyFlow: string; commission: string }> {
  const moneyFlowEl = document.querySelector<HTMLElement>('[data-report-chart="money-flow"]')
  const commissionEl = document.querySelector<HTMLElement>('[data-report-chart="commission"]')

  if (!moneyFlowEl || !commissionEl) {
    throw new Error("Gráficos do relatório não estão disponíveis para captura.")
  }

  await waitForChartPaint()

  const [moneyFlow, commission] = await Promise.all([
    captureElementAsImage(moneyFlowEl),
    captureElementAsImage(commissionEl),
  ])

  return { moneyFlow, commission }
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

/** Monta payload, captura gráficos e gera o PDF executivo financeiro. */
export async function generateFinancialReportPdf(
  input: GenerateFinancialReportInput
): Promise<void> {
  const referenceDate = input.referenceDate ?? getTodayYYYYMMDD()
  const issuedAt = new Date()

  const metrics = buildFinancialReportMetrics(
    input.transactions,
    input.period,
    input.commissionRate,
    referenceDate
  )

  const charts = await captureReportCharts()
  const clinicLogoDataUrl = await fetchImageAsDataUrl(CLINIC_LOGO_PATH)

  const payload: FinancialReportPayload = {
    clinicName: CLINIC_NAME,
    clinicLogoDataUrl,
    period: input.period,
    periodLabel: formatReportPeriodLabel(input.period, referenceDate),
    referenceDate,
    issuedAt,
    issuedBy: input.issuedBy,
    metrics,
    insights: buildFinancialReportInsights(metrics),
    charts,
  }

  const [{ pdf }, { FinancialReportPDF }] = await Promise.all([
    import("@react-pdf/renderer"),
    import("@/components/finance/report/FinancialReportPDF"),
  ])

  const blob = await pdf(<FinancialReportPDF data={payload} />).toBlob()
  const filename = buildFinancialReportFilename(input.period, referenceDate)
  downloadBlob(blob, filename)
  toast.success("Relatório financeiro gerado com sucesso!")
}
