"use client"

import { motion } from "framer-motion"
import { Filter } from "lucide-react"
import { cn } from "@/lib/utils"
import type { TaskFilter } from "./types"

const filters: { value: TaskFilter; label: string }[] = [
  { value: "all", label: "Todas" },
  { value: "completed", label: "Concluídas" },
  { value: "in_progress", label: "Em andamento" },
  { value: "pending", label: "Pendentes" },
]

type DashboardHeaderProps = {
  filter: TaskFilter
  onFilterChange: (filter: TaskFilter) => void
  taskCount: number
  compact?: boolean
}

export function DashboardHeader({
  filter,
  onFilterChange,
  taskCount,
  compact = false,
}: DashboardHeaderProps) {
  if (compact) {
    return (
      <div className="mb-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-semibold text-gray-600">Tarefas da clínica</h3>
            <p className="text-xs text-gray-500">
              {taskCount} tarefa{taskCount !== 1 ? "s" : ""}
            </p>
          </div>
          <Filter size={16} className="shrink-0 text-gray-500" />
        </div>
        <div className="-mx-1 flex gap-1.5 overflow-x-auto pb-1">
          {filters.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => onFilterChange(item.value)}
              className={cn(
                "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium transition-all duration-200",
                filter === item.value
                  ? "bg-primary text-white"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mb-6 flex flex-col gap-4 sm:mb-8 lg:flex-row lg:items-center lg:justify-between"
    >
      <div>
        <h1 className="text-2xl font-semibold text-gray-600 sm:text-3xl">
          Gerenciamento de Tarefas
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {taskCount} tarefa{taskCount !== 1 ? "s" : ""} · Clínica
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Filter size={16} className="text-gray-500" />
        {filters.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => onFilterChange(item.value)}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200 sm:text-sm",
              filter === item.value
                ? "bg-gray-500 text-white"
                : "bg-white/60 text-gray-500 hover:bg-white hover:text-gray-600"
            )}
          >
            {item.label}
          </button>
        ))}
      </div>
    </motion.header>
  )
}
