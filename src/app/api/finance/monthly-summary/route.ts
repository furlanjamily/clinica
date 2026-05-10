import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { handleApiError } from "@/lib/errors/error-handler"

const MONTH_LABELS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"] as const

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const yearParam = searchParams.get("ano")

    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonthPrefix = `${currentYear}-${String(now.getMonth() + 1).padStart(2, "0")}`

    const datesRows = await db.transaction.findMany({
      where: { status: "Confirmado" },
      select: { date: true },
    })

    const yearSet = new Set<number>()
    for (const { date } of datesRows) {
      const y = parseInt(date.slice(0, 4), 10)
      if (!Number.isNaN(y)) yearSet.add(y)
    }

    let availableYears = [...yearSet].sort((a, b) => b - a)
    if (!availableYears.includes(currentYear)) {
      availableYears = [currentYear, ...availableYears].sort((a, b) => b - a)
    }
    if (availableYears.length === 0) {
      availableYears = [currentYear]
    }

    let year = currentYear
    if (yearParam) {
      const parsed = parseInt(yearParam, 10)
      if (!Number.isNaN(parsed) && parsed >= 1900 && parsed <= 2100) {
        year = parsed
      }
    }

    if (!availableYears.includes(year)) {
      availableYears = [...new Set([year, ...availableYears])].sort((a, b) => b - a)
    }

    const [yearTxs, monthTxs] = await Promise.all([
      db.transaction.findMany({
        where: { status: "Confirmado", date: { startsWith: `${year}-` } },
        select: { date: true, type: true, amount: true },
      }),
      db.transaction.findMany({
        where: { status: "Confirmado", date: { startsWith: currentMonthPrefix } },
        select: { type: true, amount: true },
      }),
    ])

    const months = MONTH_LABELS.map((label) => ({ mes: label, receitas: 0, despesas: 0 }))

    for (const t of yearTxs) {
      const m = parseInt(t.date.slice(5, 7), 10) - 1
      if (m < 0 || m > 11) continue
      if (t.type === "Receita") months[m].receitas += t.amount
      else if (t.type === "Despesa") months[m].despesas += t.amount
    }

    let monthRevenue = 0
    let monthExpense = 0
    for (const t of monthTxs) {
      if (t.type === "Receita") monthRevenue += t.amount
      else if (t.type === "Despesa") monthExpense += t.amount
    }

    const totalRevenueYear = months.reduce((acc, m) => acc + m.receitas, 0)
    const totalExpenseYear = months.reduce((acc, m) => acc + m.despesas, 0)

    return NextResponse.json({
      ano: year,
      anosDisponiveis: availableYears,
      meses: months,
      resumoMesAtual: {
        receitas: monthRevenue,
        despesas: monthExpense,
        saldo: monthRevenue - monthExpense,
        periodo: currentMonthPrefix,
      },
      totaisAno: {
        receitas: totalRevenueYear,
        despesas: totalExpenseYear,
        saldo: totalRevenueYear - totalExpenseYear,
      },
    })
  } catch (err) {
    return handleApiError(err)
  }
}
