"use client"

import { motion } from "framer-motion"
import { ProjectOverviewCard } from "./ProjectOverviewCard"
import { useDashboard } from "./DashboardDataProvider"

const BRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
})

function buildCards(kpis, periodLabel) {
  if (!kpis) {
    return [
      { id: 1, title: "Pacientes", value: "—", description: "Carregando...", featured: true },
      { id: 2, title: "Atendimentos", value: "—", description: "Carregando..." },
      { id: 3, title: "Faturamento", value: "—", description: "Carregando..." },
      { id: 4, title: "Prontuários", value: "—", description: "Carregando..." },
    ]
  }

  return [
    {
      id: 1,
      title: "Pacientes",
      value: kpis.patientsInRange,
      growth: kpis.newPatientsRange || undefined,
      description: kpis.newPatientsRange
        ? `${kpis.newPatientsRange} novos ${periodLabel}`
        : `Com consulta ${periodLabel}`,
      featured: true,
    },
    {
      id: 2,
      title: "Atendimentos",
      value: kpis.completedRange,
      growth:
        kpis.completedGrowthPct != null && kpis.completedGrowthPct > 0
          ? `${kpis.completedGrowthPct}%`
          : undefined,
      description: `${kpis.attendanceRate}% de comparecimento`,
    },
    {
      id: 3,
      title: "Faturamento",
      value: BRL.format(kpis.revenueRange),
      growth:
        kpis.revenueGrowthPct != null && kpis.revenueGrowthPct > 0
          ? `${kpis.revenueGrowthPct}%`
          : undefined,
      description: `Receitas confirmadas ${periodLabel}`,
    },
    {
      id: 4,
      title: "Prontuários",
      value: kpis.recordsRange,
      description: `${kpis.scheduledInRange} agendadas ${periodLabel}`,
    },
  ]
}

export function ProjectOverviewCards() {
  const { data, loading } = useDashboard()
  const cards = buildCards(loading ? null : data?.kpis, data?.periodLabel ?? "no período")

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
      className="grid min-w-0 grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4"
    >
      {cards.map((card, index) => (
        <ProjectOverviewCard key={card.id} card={card} index={index} />
      ))}
    </motion.div>
  )
}
