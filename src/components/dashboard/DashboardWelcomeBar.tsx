"use client"

import { motion } from "framer-motion"
import { ChevronDown, Download, FileText } from "lucide-react"
import { cn } from "@/lib/utils"
import { useSession } from "next-auth/react"
import { useDashboard, type DashboardPeriod } from "./DashboardDataProvider"

const PERIOD_OPTIONS: { value: DashboardPeriod; label: string }[] = [
  { value: "day", label: "Dia" },
  { value: "week", label: "Semana" },
  { value: "month", label: "Mês" },
]

function ActionButton({
  label,
  icon,
  onClick,
}: {
  label: string
  icon: React.ReactNode
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2.5 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-500 shadow-sm transition-all duration-200 hover:border-gray-300 hover:text-gray-600"
    >
      {label}
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-gray-500">
        {icon}
      </span>
    </button>
  )
}

export function DashboardWelcomeBar() {
  const { period, setPeriod, loading } = useDashboard()
  const { data: session } = useSession();

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="relative z-0 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <h1 className="text-xl font-semibold text-gray-600 sm:text-2xl">
        Bem vindo de volta, {session?.user?.name}!
      </h1>

      <div className="flex flex-wrap items-center gap-3">
        <ActionButton
          label="Gerar Relatório"
          icon={<FileText size={14} />}
        />

        <div className="relative">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as DashboardPeriod)}
            disabled={loading}
            className={cn(
              "h-10 appearance-none rounded-full bg-primary pl-4 pr-12 text-sm font-medium text-white outline-none",
              "transition-colors duration-200 hover:bg-[#8538F0] focus:ring-2 focus:ring-primary/30",
              loading && "opacity-70"
            )}
          >
            {PERIOD_OPTIONS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-white">
            <ChevronDown size={14} className="text-gray-500" />
          </span>
        </div>
      </div>
    </motion.div>
  )
}
