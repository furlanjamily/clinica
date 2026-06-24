import { getTodayYYYYMMDD } from "@/lib/time/tz-date"
import {
  getConfirmedTransactionsForPeriod,
  type RecordPeriod,
} from "./period-filter"
import { calculateCommission } from "./summary"
import { TransactionType, type FinanceTransaction } from "./types"

export type MoneyFlowPoint = {
  date: string
  label: string
  income: number
  expense: number
  balance: number
}

const WEEKDAY_PT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"] as const
const MONTH_PT = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"] as const

function addDaysStr(date: string, days: number): string {
  const [y, m, d] = date.split("-").map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d + days))
  return dt.toISOString().slice(0, 10)
}

function weekDatesFrom(date: string): string[] {
  const [y, m, d] = date.split("-").map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  const dow = dt.getUTCDay()
  const mondayOffset = dow === 0 ? -6 : 1 - dow
  const weekStart = addDaysStr(date, mondayOffset)
  return Array.from({ length: 7 }, (_, i) => addDaysStr(weekStart, i))
}

function formatDayLabel(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  const day = String(d).padStart(2, "0")
  const month = MONTH_PT[m - 1]
  const weekday = WEEKDAY_PT[dt.getUTCDay()]
  return `${day} ${month}, ${weekday}`
}

function daysInMonth(yearMonth: string): string[] {
  const [y, m] = yearMonth.split("-").map(Number)
  const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate()
  return Array.from({ length: lastDay }, (_, i) =>
    `${yearMonth}-${String(i + 1).padStart(2, "0")}`
  )
}

function formatMonthDayLabel(dateStr: string): string {
  const [, m, d] = dateStr.split("-").map(Number)
  return `${String(d).padStart(2, "0")} ${MONTH_PT[m - 1]}`
}

function sumByType(transactions: FinanceTransaction[], type: FinanceTransaction["type"]) {
  return transactions
    .filter((t) => t.type === type)
    .reduce((acc, t) => acc + t.amount, 0)
}

function pointFromTransactions(
  date: string,
  label: string,
  transactions: FinanceTransaction[],
  commissionRate: number
): MoneyFlowPoint {
  const income = sumByType(transactions, TransactionType.Income)
  const expenseFromTransactions = sumByType(transactions, TransactionType.Expense)
  const commission = calculateCommission(income, commissionRate)

  return {
    date,
    label,
    income,
    expense: expenseFromTransactions + commission,
    balance: income - (expenseFromTransactions + commission),
  }
}

export function buildMoneyFlowData(
  transactions: FinanceTransaction[],
  period: RecordPeriod,
  commissionRate: number,
  referenceDate = getTodayYYYYMMDD()
): MoneyFlowPoint[] {
  const inPeriod = getConfirmedTransactionsForPeriod(transactions, period, referenceDate)

  if (period === "hoje") {
    return [pointFromTransactions(referenceDate, "Hoje", inPeriod, commissionRate)]
  }

  if (period === "semana") {
    const weekDates = weekDatesFrom(referenceDate)
    return weekDates.map((date) =>
      pointFromTransactions(
        date,
        formatDayLabel(date),
        inPeriod.filter((t) => t.date === date),
        commissionRate
      )
    )
  }

  if (period === "mes") {
    const monthPrefix = referenceDate.slice(0, 7)
    return daysInMonth(monthPrefix).map((date) =>
      pointFromTransactions(
        date,
        formatMonthDayLabel(date),
        inPeriod.filter((t) => t.date === date),
        commissionRate
      )
    )
  }

  const year = referenceDate.slice(0, 4)
  return MONTH_PT.map((label, index) => {
    const monthPrefix = `${year}-${String(index + 1).padStart(2, "0")}`
    const monthTxs = inPeriod.filter((t) => t.date.startsWith(monthPrefix))
    return pointFromTransactions(monthPrefix, label, monthTxs, commissionRate)
  })
}

const PERIOD_HIGHLIGHT_LABEL: Record<RecordPeriod, string> = {
  hoje: "Hoje",
  semana: "Semana",
  mes: "Mês",
  ano: "Ano",
}

function niceRoundMax(value: number): number {
  if (value <= 0) return 1000
  const magnitude = 10 ** Math.floor(Math.log10(value))
  const normalized = value / magnitude
  const nice =
    normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10
  return nice * magnitude
}

export function formatMoneyFlowAxisValue(value: number): string {
  const abs = Math.abs(value)
  const sign = value < 0 ? "-" : ""
  if (abs >= 1000) {
    const thousands = abs / 1000
    const formatted =
      thousands % 1 === 0 ? String(thousands) : thousands.toFixed(1).replace(".", ",")
    return `${sign}R$ ${formatted}k`
  }
  const fractionDigits = abs > 0 && abs < 100 ? 1 : 0
  return (
    sign +
    abs
      .toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits,
      })
      .replace(/\u00a0/g, " ")
  )
}

export type ChartPoint = { x: number; y: number }

export const CHART_WIDTH = 560
export const CHART_HEIGHT = 180
export const CHART_PAD_X = 14
export const CHART_PAD_TOP = 12
export const CHART_PAD_BOTTOM = 15

export type MoneyFlowChartData = {
  incomePoints: ChartPoint[]
  expensePoints: ChartPoint[]
  balancePoints: ChartPoint[]
  yLabels: string[]
  gridLineYs: number[]
  highlightIndex: number
  highlightIncome: number
  highlightExpense: number
  highlightBalance: number
  highlightLabel: string
  highlightXPercent: number
  showPointMarker: boolean
}

function sumPoints(points: MoneyFlowPoint[], field: "income" | "expense" | "balance"): number {
  return points.reduce((acc, p) => acc + p[field], 0)
}

function buildYScale(points: MoneyFlowPoint[]) {
  const values = points.flatMap((p) => [p.income, p.expense, p.balance])
  const maxVal = Math.max(1, ...values)
  const minVal = Math.min(0, ...values)
  const yMax = niceRoundMax(maxVal)
  const yMin = minVal < 0 ? -niceRoundMax(Math.abs(minVal)) : 0
  return { yMin, yMax }
}

export function buildMoneyFlowChartData(
  points: MoneyFlowPoint[],
  period: RecordPeriod,
  chartWidth = CHART_WIDTH,
  chartHeight = CHART_HEIGHT
): MoneyFlowChartData {
  const { yMin, yMax } = buildYScale(points)
  const yLabels = [yMax, yMin + ((yMax - yMin) * 2) / 3, yMin + (yMax - yMin) / 3, yMin].map(
    formatMoneyFlowAxisValue
  )

  const plotWidth = chartWidth - CHART_PAD_X * 2
  const plotHeight = chartHeight - CHART_PAD_TOP - CHART_PAD_BOTTOM
  const valueSpan = yMax - yMin || 1
  const toY = (value: number) =>
    CHART_PAD_TOP + plotHeight - ((value - yMin) / valueSpan) * plotHeight
  const step = points.length > 1 ? plotWidth / (points.length - 1) : 0
  const toX = (index: number) =>
    points.length > 1 ? CHART_PAD_X + index * step : chartWidth / 2

  const gridLineYs = [0, 1, 2, 3].map(
    (i) => CHART_PAD_TOP + (plotHeight * i) / 3
  )

  const incomePoints = points.map((p, i) => ({
    x: toX(i),
    y: toY(p.income),
  }))
  const expensePoints = points.map((p, i) => ({
    x: toX(i),
    y: toY(p.expense),
  }))
  const balancePoints = points.map((p, i) => ({
    x: toX(i),
    y: toY(p.balance),
  }))

  const isDayView = period === "hoje"
  const highlightIndex = isDayView
    ? 0
    : Math.max(0, Math.floor((points.length - 1) / 2))
  const highlightPoint = points[highlightIndex]

  const highlightIncome = isDayView
    ? (highlightPoint?.income ?? 0)
    : sumPoints(points, "income")
  const highlightExpense = isDayView
    ? (highlightPoint?.expense ?? 0)
    : sumPoints(points, "expense")
  const highlightBalance = highlightIncome - highlightExpense

  const highlightX = isDayView
    ? (incomePoints[highlightIndex]?.x ?? chartWidth / 2)
    : chartWidth / 2
  const highlightXPercent = (highlightX / chartWidth) * 100

  return {
    incomePoints,
    expensePoints,
    balancePoints,
    yLabels,
    gridLineYs,
    highlightIndex,
    highlightIncome,
    highlightExpense,
    highlightBalance,
    highlightLabel: isDayView
      ? (highlightPoint?.label ?? PERIOD_HIGHLIGHT_LABEL.hoje)
      : PERIOD_HIGHLIGHT_LABEL[period],
    highlightXPercent,
    showPointMarker: isDayView,
  }
}

export function pointsToSmoothPath(points: ChartPoint[]): string {
  if (points.length === 0) return ""
  if (points.length === 1) return `M${points[0].x} ${points[0].y}`

  let d = `M${points[0].x} ${points[0].y}`
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1]
    const curr = points[i]
    const cpx1 = prev.x + (curr.x - prev.x) / 3
    const cpx2 = prev.x + (2 * (curr.x - prev.x)) / 3
    d += ` C${cpx1} ${prev.y}, ${cpx2} ${curr.y}, ${curr.x} ${curr.y}`
  }
  return d
}
