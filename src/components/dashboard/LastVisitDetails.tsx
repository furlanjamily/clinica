"use client"

import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { useDashboard } from "./DashboardDataProvider"
import {
  DASHBOARD_LAST_VISIT_BODY,
  DASHBOARD_LAST_VISIT_SHELL,
} from "./dashboard-panel-layout"
import { LastVisitDetailsSkeleton } from "./LastVisitDetailsSkeleton"

export function LastVisitDetails() {
  const { data, loading } = useDashboard()
  const focus = data?.focusPatient
  const visit = data?.lastVisit
  const isEmpty = !loading && !focus

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.25 }}
      whileHover={{ y: -2 }}
      className={DASHBOARD_LAST_VISIT_SHELL}
    >
      <Card className="flex h-full min-h-0 flex-col overflow-hidden rounded-[20px] border-0 bg-white p-6 shadow-[0_2px_16px_rgba(0,0,0,0.05)]">
        <h3 className="mb-5 shrink-0 text-base font-semibold text-gray-600">Último atendimento</h3>

        <div
          className={cn(
            DASHBOARD_LAST_VISIT_BODY,
            isEmpty && "flex items-center justify-center"
          )}
        >
          {loading ? (
            <LastVisitDetailsSkeleton />
          ) : !focus ? (
            <p className="text-center text-sm text-gray-400">
              Nenhum paciente na agenda {data?.periodLabel ?? "no período"}.
            </p>
          ) : (
            <div className="flex min-h-full flex-col">
              <div className="mb-5 shrink-0 rounded-2xl bg-gray-50 px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-primary">
                  {focus.contextLabel}
                </p>
                <p className="mt-1 text-base font-bold text-gray-600">{focus.patientName}</p>
                {focus.demographics ? (
                  <p className="mt-0.5 text-sm text-gray-500">{focus.demographics}</p>
                ) : null}
                <p className="mt-2 text-xs text-gray-500">
                  {focus.appointmentDate.split("-").reverse().join("/")} · {focus.appointmentTime}
                  {" · "}
                  {focus.statusLabel}
                </p>
              </div>

              {!visit ? (
                <div className="flex flex-1 items-center justify-center py-4">
                  <p className="text-center text-sm text-gray-400">
                    Nenhum atendimento anterior registrado para este paciente.
                  </p>
                </div>
              ) : (
                <div className="space-y-5 pb-1">
                  <section>
                    <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Atendimento anterior
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
              )}
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  )
}
