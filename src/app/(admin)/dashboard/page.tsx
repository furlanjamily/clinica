"use client"

import { useCallback, useEffect, useState } from "react"
import { Chart, type FinanceMonthPoint } from "@/components/ui/Chart"
import { MetricCard } from "@/components/ui/MetricCard"
import { Header } from "@/components/ui/PageHeader"

type SummaryResponse = {
  ano: number
  anosDisponiveis: number[]
  meses: FinanceMonthPoint[]
  resumoMesAtual: {
    receitas: number
    despesas: number
    saldo: number
    periodo: string
  }
  totaisAno: {
    receitas: number
    despesas: number
    saldo: number
  }
}

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })

export default function Dashboard() {
  const [ano, setAno] = useState(() => new Date().getFullYear())
  const [summary, setSummary] = useState<SummaryResponse | null>(null)
  const [pending, setPending] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (year: number) => {
    setPending(true)
    setError(null)
    try {
      const res = await fetch(`/api/finance/monthly-summary?ano=${year}`)
      const body = (await res.json()) as SummaryResponse & { message?: string }
      if (!res.ok) {
        setError(body?.message ?? "Não foi possível carregar os dados financeiros.")
        return
      }
      setSummary(body)
    } catch {
      setError("Não foi possível carregar os dados financeiros.")
    } finally {
      setPending(false)
    }
  }, [])

  useEffect(() => {
    void load(ano)
  }, [ano, load])

  const mesAtual = summary?.resumoMesAtual
  const metricsPending = pending && !summary

  return (
    <div className="flex w-full flex-col gap-6">
      <div>
        <Header title="Dashboard" />
        <p className="text-accent">Resumo financeiro com base nas transações confirmadas.</p>
      </div>

      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-4">
        <MetricCard
          title="Receitas (mês atual)"
          value={metricsPending ? "…" : fmt(mesAtual?.receitas ?? 0)}
        />
        <MetricCard
          title="Despesas (mês atual)"
          value={metricsPending ? "…" : fmt(mesAtual?.despesas ?? 0)}
        />
        <MetricCard title="Saldo (mês atual)" value={metricsPending ? "…" : fmt(mesAtual?.saldo ?? 0)} />
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-primary" />
            <span className="font-bold text-slate-700">Receitas e despesas por mês</span>
          </div>
          {!pending && summary ? (
            <p className="text-sm text-slate-500">
              Ano {summary.ano}: receitas {fmt(summary.totaisAno.receitas)} · despesas{" "}
              {fmt(summary.totaisAno.despesas)} · saldo {fmt(summary.totaisAno.saldo)}
            </p>
          ) : pending ? (
            <p className="text-sm text-slate-400">Atualizando totais…</p>
          ) : null}
        </div>

        <Chart
          data={summary?.meses ?? []}
          years={summary?.anosDisponiveis ?? [ano]}
          selectedYear={summary?.ano ?? ano}
          onYearChange={setAno}
          loading={pending}
        />
      </div>
    </div>
  )
}
