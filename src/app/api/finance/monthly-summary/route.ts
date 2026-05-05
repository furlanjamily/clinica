import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { handleApiError } from "@/lib/errors/error-handler"

const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"] as const

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const anoParam = searchParams.get("ano")

    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonthPrefix = `${currentYear}-${String(now.getMonth() + 1).padStart(2, "0")}`

    const datesRows = await db.transacao.findMany({
      where: { status: "Confirmado" },
      select: { data: true },
    })

    const yearSet = new Set<number>()
    for (const { data } of datesRows) {
      const y = parseInt(data.slice(0, 4), 10)
      if (!Number.isNaN(y)) yearSet.add(y)
    }

    let anosDisponiveis = [...yearSet].sort((a, b) => b - a)
    if (!anosDisponiveis.includes(currentYear)) {
      anosDisponiveis = [currentYear, ...anosDisponiveis].sort((a, b) => b - a)
    }
    if (anosDisponiveis.length === 0) {
      anosDisponiveis = [currentYear]
    }

    let ano = currentYear
    if (anoParam) {
      const parsed = parseInt(anoParam, 10)
      if (!Number.isNaN(parsed) && parsed >= 1900 && parsed <= 2100) {
        ano = parsed
      }
    }

    if (!anosDisponiveis.includes(ano)) {
      anosDisponiveis = [...new Set([ano, ...anosDisponiveis])].sort((a, b) => b - a)
    }

    const [yearTxs, monthTxs] = await Promise.all([
      db.transacao.findMany({
        where: { status: "Confirmado", data: { startsWith: `${ano}-` } },
        select: { data: true, tipo: true, valor: true },
      }),
      db.transacao.findMany({
        where: { status: "Confirmado", data: { startsWith: currentMonthPrefix } },
        select: { tipo: true, valor: true },
      }),
    ])

    const meses = MESES.map((mes) => ({ mes, receitas: 0, despesas: 0 }))

    for (const t of yearTxs) {
      const m = parseInt(t.data.slice(5, 7), 10) - 1
      if (m < 0 || m > 11) continue
      if (t.tipo === "Receita") meses[m].receitas += t.valor
      else if (t.tipo === "Despesa") meses[m].despesas += t.valor
    }

    let receitasMes = 0
    let despesasMes = 0
    for (const t of monthTxs) {
      if (t.tipo === "Receita") receitasMes += t.valor
      else if (t.tipo === "Despesa") despesasMes += t.valor
    }

    const totalReceitasAno = meses.reduce((acc, m) => acc + m.receitas, 0)
    const totalDespesasAno = meses.reduce((acc, m) => acc + m.despesas, 0)

    return NextResponse.json({
      ano,
      anosDisponiveis,
      meses,
      resumoMesAtual: {
        receitas: receitasMes,
        despesas: despesasMes,
        saldo: receitasMes - despesasMes,
        periodo: currentMonthPrefix,
      },
      totaisAno: {
        receitas: totalReceitasAno,
        despesas: totalDespesasAno,
        saldo: totalReceitasAno - totalDespesasAno,
      },
    })
  } catch (err) {
    return handleApiError(err)
  }
}
