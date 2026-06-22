"use client"

import { motion } from "framer-motion"
import { ProjectOverviewCard } from "./ProjectOverviewCard"
import { ProjectOverviewCardSkeleton } from "./ProjectOverviewCardSkeleton"
import { useDashboard } from "./DashboardDataProvider"

const BRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
})

function buildCards(kpis, periodLabel) {
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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
      className="grid min-w-0 grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4"
    >
      {loading
        ? Array.from({ length: 4 }).map((_, index) => (
            <ProjectOverviewCardSkeleton
              key={index}
              index={index}
              featured={index === 0}
            />
          ))
        : buildCards(data?.kpis, data?.periodLabel ?? "no período").map((card, index) => (
            <ProjectOverviewCard key={card.id} card={card} index={index} />
          ))}
    </motion.div>
  )
}
