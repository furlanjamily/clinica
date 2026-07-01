"use client"

import { useMemo } from "react"
import { motion } from "framer-motion"
import {
  Check,
  Copy,
  Link2,
  MessageSquare,
  Monitor,
  Pencil,
  Ruler,
  Trash2,
  Zap,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  DaySectionHeader,
  formatDayHeader,
  formatShortDate,
  groupByDay as groupItemsByDay,
} from "@/components/dashboard/group-by-day"
import type { ClinicTask, TaskIcon, TaskStatus } from "./types"

const iconMap: Record<TaskIcon, React.ComponentType<{ className?: string; size?: number }>> = {
  monitor: Monitor,
  zap: Zap,
  message: MessageSquare,
  ruler: Ruler,
  link: Link2,
  calendar: Monitor,
  stethoscope: Zap,
}

type TaskListProps = {
  tasks: ClinicTask[]
  compact?: boolean
  groupByDay?: boolean
  onToggleComplete: (id: number) => void
  onEdit: (task: ClinicTask) => void
  onDelete: (id: number) => void
  onDuplicate: (task: ClinicTask) => void
}

function taskDayKey(task: ClinicTask): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(task.date)) return task.date
  return `outros-${task.date}`
}

function formatTaskDateLine(task: ClinicTask, grouped: boolean): string {
  if (grouped && /^\d{4}-\d{2}-\d{2}$/.test(task.date)) {
    return task.time
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(task.date)) {
    return `${formatShortDate(task.date)}, ${task.time}`
  }
  return `${task.date}, ${task.time}`
}

function StatusIndicator({
  status,
  onToggle,
}: {
  status: TaskStatus
  onToggle: () => void
}) {
  const isCompleted = status === "completed"
  const label = isCompleted ? "Marcar como pendente" : "Marcar como concluída"

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={label}
      title={label}
      className="shrink-0 rounded-full transition-transform hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
    >
      {isCompleted ? (
        <div
          className="flex h-7 w-7 items-center justify-center rounded-full"
          style={{
            background: "linear-gradient(135deg, #5B21B6 0%, #8538F0 50%, #9747FF 100%)",
          }}
        >
          <Check size={14} className="text-white" strokeWidth={3} />
        </div>
      ) : status === "in_progress" ? (
        <div className="flex h-7 w-7 items-center justify-center rounded-full border-[3px] border-primary bg-primary/20">
          <Check size={12} className="text-white/70" strokeWidth={2.5} />
        </div>
      ) : (
        <div className="flex h-7 w-7 items-center justify-center rounded-full border-[3px] border-[#8538F0] hover:bg-white/10">
          <Check size={12} className="text-white/40" strokeWidth={2.5} />
        </div>
      )}
    </button>
  )
}

function TaskIconCircle({ icon, completed }: { icon?: TaskIcon; completed: boolean }) {
  const Icon = iconMap[icon ?? "monitor"]

  return (
    <div
      className={cn(
        "flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors",
        completed ? "bg-gray-400 text-white/50" : "bg-white text-gray-500"
      )}
    >
      <Icon size={18} />
    </div>
  )
}

function TaskRow({
  task,
  index,
  compact,
  grouped,
  onToggleComplete,
  onEdit,
  onDelete,
  onDuplicate,
}: {
  task: ClinicTask
  index: number
  compact: boolean
  grouped: boolean
  onToggleComplete: (id: number) => void
  onEdit: (task: ClinicTask) => void
  onDelete: (id: number) => void
  onDuplicate: (task: ClinicTask) => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      whileHover={{ backgroundColor: "rgba(255,255,255,0.04)" }}
      className={cn(
        "group flex flex-col gap-3 rounded-2xl px-2 py-3 transition-colors sm:flex-row sm:items-center sm:justify-between sm:px-3",
        compact && "gap-2 py-2"
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
        <TaskIconCircle icon={task.icon} completed={task.status === "completed"} />
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "truncate text-sm font-medium sm:text-base",
              task.status === "completed" ? "text-white/40 line-through" : "text-white"
            )}
          >
            {task.title}
          </p>
          <p className="mt-0.5 text-xs text-white/40 sm:text-sm">
            {formatTaskDateLine(task, grouped)}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 pl-14 sm:justify-end sm:pl-0">
        <StatusIndicator
          status={task.status}
          onToggle={() => onToggleComplete(task.id)}
        />

        <div className="flex items-center gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
          <button
            type="button"
            onClick={() => onEdit(task)}
            aria-label="Editar"
            className="rounded-full p-2 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
          >
            <Pencil size={15} />
          </button>
          <button
            type="button"
            onClick={() => onDuplicate(task)}
            aria-label="Duplicar"
            className="rounded-full p-2 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
          >
            <Copy size={15} />
          </button>
          <button
            type="button"
            onClick={() => onDelete(task.id)}
            aria-label="Excluir"
            className="rounded-full p-2 text-white/50 transition-colors hover:bg-white/10 hover:text-red-400"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    </motion.div>
  )
}

export function TaskList({
  tasks,
  compact = false,
  groupByDay = false,
  onToggleComplete,
  onEdit,
  onDelete,
  onDuplicate,
}: TaskListProps) {
  const dayGroups = useMemo(() => {
    if (!groupByDay) return []
    return groupItemsByDay(tasks, taskDayKey).map((group) => ({
      ...group,
      label: group.date.startsWith("outros-")
        ? group.date.replace("outros-", "")
        : formatDayHeader(group.date),
    }))
  }, [tasks, groupByDay])

  if (tasks.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-center text-sm text-white/40">Nenhuma tarefa encontrada.</p>
      </div>
    )
  }

  if (groupByDay && dayGroups.length > 0) {
    let rowIndex = 0
    return (
      <div className="space-y-1">
        {dayGroups.map((group) => (
          <section key={group.date}>
            <DaySectionHeader
              label={group.label}
              count={group.items.length}
              variant="dark"
              countNoun={{ one: "tarefa", other: "tarefas" }}
            />
            {group.items.map((task) => {
              const index = rowIndex++
              return (
                <TaskRow
                  key={task.id}
                  task={task}
                  index={index}
                  compact={compact}
                  grouped
                  onToggleComplete={onToggleComplete}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onDuplicate={onDuplicate}
                />
              )
            })}
          </section>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {tasks.map((task, index) => (
        <TaskRow
          key={task.id}
          task={task}
          index={index}
          compact={compact}
          grouped={false}
          onToggleComplete={onToggleComplete}
          onEdit={onEdit}
          onDelete={onDelete}
          onDuplicate={onDuplicate}
        />
      ))}
    </div>
  )
}
