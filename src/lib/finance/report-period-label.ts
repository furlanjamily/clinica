import { getTodayYYYYMMDD } from "@/lib/time/tz-date"
import type { RecordPeriod } from "./period-filter"
import { getPeriodDateRange } from "./period-filter"

const MONTH_NAMES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
] as const

function isoWeekNumber(dateStr: string): number {
  const [y, m, d] = dateStr.split("-").map(Number)
  const date = new Date(Date.UTC(y, m - 1, d))
  const dayNum = date.getUTCDay() || 7
  date.setUTCDate(date.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
}

function formatDateBR(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number)
  return `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}`
}

/** Rótulo legível do período ativo na dashboard. */
export function formatReportPeriodLabel(
  period: RecordPeriod,
  referenceDate = getTodayYYYYMMDD()
): string {
  const { start, end } = getPeriodDateRange(period, referenceDate)

  if (period === "hoje") {
    return formatDateBR(referenceDate)
  }

  if (period === "semana") {
    return `${formatDateBR(start)} — ${formatDateBR(end)}`
  }

  if (period === "mes") {
    const [y, m] = referenceDate.slice(0, 7).split("-").map(Number)
    return `${MONTH_NAMES[m - 1]} de ${y}`
  }

  return referenceDate.slice(0, 4)
}

/** Nome do arquivo PDF conforme período ativo. */
export function buildFinancialReportFilename(
  period: RecordPeriod,
  referenceDate = getTodayYYYYMMDD()
): string {
  if (period === "hoje") {
    return `Relatorio_Financeiro_Dia_${referenceDate}.pdf`
  }

  if (period === "semana") {
    const year = referenceDate.slice(0, 4)
    const week = String(isoWeekNumber(referenceDate)).padStart(2, "0")
    return `Relatorio_Financeiro_Semana_${year}-S${week}.pdf`
  }

  if (period === "mes") {
    const [y, m] = referenceDate.slice(0, 7).split("-").map(Number)
    return `Relatorio_Financeiro_${MONTH_NAMES[m - 1]}_${y}.pdf`
  }

  return `Relatorio_Financeiro_${referenceDate.slice(0, 4)}.pdf`
}
