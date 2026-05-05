"use client"

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"

export type FinanceMonthPoint = { mes: string; receitas: number; despesas: number }

const fmtBrl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })

type Props = {
  data: FinanceMonthPoint[]
  years: number[]
  selectedYear: number
  onYearChange: (year: number) => void
  loading?: boolean
}

export function Chart({ data, years, selectedYear, onYearChange, loading }: Props) {
  if (loading) {
    return (
      <div className="flex h-[320px] w-full items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
        Carregando gráfico…
      </div>
    )
  }

  return (
    <>
      <label className="mb-3 flex items-center gap-2 text-sm text-slate-600">
        <span className="font-medium">Ano</span>
        <select
          value={selectedYear}
          onChange={(e) => onYearChange(Number(e.target.value))}
          className="rounded-md border border-slate-200 bg-white px-3 py-2 text-slate-800 shadow-sm"
        >
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </label>

      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <XAxis dataKey="mes" padding={{ left: 12, right: 12 }} tick={{ fontSize: 12 }} />
          <YAxis
            tick={{ fontSize: 11 }}
            tickFormatter={(v) =>
              Number(v).toLocaleString("pt-BR", { notation: "compact", maximumFractionDigits: 1 })
            }
          />
          <Tooltip
            formatter={(value) => {
              const n = typeof value === "number" ? value : Number(value ?? 0)
              return fmtBrl(Number.isFinite(n) ? n : 0)
            }}
          />
          <Legend />
          <Line
            type="monotone"
            name="Receitas"
            dataKey="receitas"
            stroke="#9747FF"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            name="Despesas"
            dataKey="despesas"
            stroke="#624DE3"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </>
  )
}
