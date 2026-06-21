"use client"

import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { useDashboard } from "./DashboardDataProvider"

export function LastVisitDetails() {
  const { data, loading, period } = useDashboard()
  const visit = data?.lastVisit

  const emptyMessage =
    period === "today"
      ? "Nenhum atendimento registrado hoje."
      : period === "week"
        ? "Nenhum atendimento registrado nesta semana."
        : "Nenhum atendimento registrado neste mês."

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.25 }}
      whileHover={{ y: -2 }}
    >
      <Card className="rounded-[20px] border-0 bg-white p-6 shadow-[0_2px_16px_rgba(0,0,0,0.05)]">
        <h3 className="mb-5 text-base font-semibold text-gray-600">Último atendimento</h3>

        {loading ? (
          <p className="py-6 text-center text-sm text-gray-400">Carregando...</p>
        ) : !visit ? (
          <p className="py-6 text-center text-sm text-gray-400">{emptyMessage}</p>
        ) : (
          <>
            <div className="mb-5">
              <p className="text-lg font-bold text-gray-600">{visit.patientName}</p>
              {visit.demographics ? (
                <p className="mt-0.5 text-sm text-gray-500">{visit.demographics}</p>
              ) : null}
              <p className="mt-1 text-xs font-medium text-gray-400">{visit.patientId}</p>
            </div>

            <div className="space-y-5">
              <section>
                <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Atendido por
                </h4>
                <p className="text-sm font-medium text-gray-600">{visit.lastChecked.doctor}</p>
                <p className="text-sm text-gray-500">{visit.lastChecked.date}</p>
              </section>

              {visit.diagnosis ? (
                <section>
                  <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Diagnóstico
                  </h4>
                  <p className="text-sm leading-relaxed text-gray-500">{visit.diagnosis}</p>
                </section>
              ) : null}

              {visit.observation ? (
                <section>
                  <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Exame psíquico / histórico
                  </h4>
                  <p className="text-sm leading-relaxed text-gray-500">{visit.observation}</p>
                </section>
              ) : null}

              {visit.conduct ? (
                <section>
                  <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Conduta
                  </h4>
                  <p className="text-sm leading-relaxed text-gray-500">{visit.conduct}</p>
                </section>
              ) : null}

              {visit.prescriptions.length > 0 ? (
                <section>
                  <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Prescrição
                  </h4>
                  <ul className="space-y-1">
                    {visit.prescriptions.map((rx) => (
                      <li key={rx.drug} className="text-sm text-gray-500">
                        <span className="font-medium">{rx.drug}</span>
                        {rx.instruction ? <span> – {rx.instruction}</span> : null}
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
            </div>
          </>
        )}
      </Card>
    </motion.div>
  )
}
