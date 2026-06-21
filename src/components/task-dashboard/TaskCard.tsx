"use client"

import { motion } from "framer-motion"
import { Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { TaskProgress } from "./TaskProgress"
import type { ClinicTask } from "./types"
import { TaskList } from "./TaskList"
import {
  DASHBOARD_PANEL_BODY_H,
  DASHBOARD_PANEL_EMPTY_MIN,
  DASHBOARD_PANEL_SCROLL,
} from "@/components/dashboard/dashboard-panel-layout"

type TaskCardProps = {
  tasks: ClinicTask[]
  completed: number
  total: number
  onAdd: () => void
  onToggleComplete: (id: number) => void
  onEdit: (task: ClinicTask) => void
  onDelete: (id: number) => void
  onDuplicate: (task: ClinicTask) => void
  compact?: boolean
  fillHeight?: boolean
  groupByDay?: boolean
}

export function TaskCard({
  tasks,
  completed,
  total,
  onAdd,
  onToggleComplete,
  onEdit,
  onDelete,
  onDuplicate,
  compact = false,
  fillHeight = false,
  groupByDay = false,
}: TaskCardProps) {
  return (
    <div
      className={cn(
        "relative w-full",
        !compact && "mx-auto max-w-[1400px]",
        compact && fillHeight && "flex min-h-0 flex-1 flex-col"
      )}
    >
      {!compact && (
        <>
          <div
            aria-hidden
            className="absolute inset-x-6 bottom-0 top-8 rounded-[40px] bg-gray-400 opacity-50"
          />
          <div
            aria-hidden
            className="absolute inset-x-3 bottom-0 top-4 rounded-[40px] bg-gray-500 opacity-70"
          />
        </>
      )}

      <motion.div
        initial={{ opacity: 0, y: compact ? 12 : 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        whileHover={compact ? undefined : { y: -2 }}
        className={cn(
          "relative bg-primary",
          !compact && "shadow-[0_24px_80px_rgba(107,114,128,0.3)]",
          compact
            ? cn("flex flex-col rounded-[24px] p-4", fillHeight && "min-h-0 flex-1 overflow-hidden")
            : "rounded-[40px] p-6 sm:p-8"
        )}
      >
        <div
          className={cn(
            "flex shrink-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between",
            compact ? "mb-4" : "mb-6 gap-4 sm:mb-8"
          )}
        >
          <div>
            <h3
              className={cn(
                "font-semibold text-white",
                compact ? "text-base" : "text-xl sm:text-2xl"
              )}
            >
              Tarefas da clínica
            </h3>
            <p className={cn("text-white/50", compact ? "mt-0.5 text-[11px]" : "mt-1 text-sm")}>
              Gestão de atividades
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <TaskProgress completed={completed} total={total} compact={compact} />
            <motion.button
              type="button"
              onClick={onAdd}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.2 }}
              aria-label="Adicionar tarefa"
              className={cn(
                "flex shrink-0 items-center justify-center rounded-full bg-primary text-white transition-colors hover:bg-primary/70",
                compact ? "h-8 w-8" : "h-10 w-10 shadow-lg"
              )}
            >
              <Plus size={compact ? 16 : 20} strokeWidth={2.5} />
            </motion.button>
          </div>
        </div>

        <div
          className={cn(
            DASHBOARD_PANEL_SCROLL,
            compact &&
              (fillHeight
                ? cn("min-h-0 flex-1", DASHBOARD_PANEL_EMPTY_MIN)
                : DASHBOARD_PANEL_BODY_H),
            !compact && "max-h-[320px]"
          )}
        >
          <TaskList
            tasks={tasks}
            compact={compact}
            groupByDay={groupByDay}
            onToggleComplete={onToggleComplete}
            onEdit={onEdit}
            onDelete={onDelete}
            onDuplicate={onDuplicate}
          />
        </div>
      </motion.div>
    </div>
  )
}
