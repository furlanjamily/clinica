"use client"

import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import { useDashboard, type DashboardAgendaItem } from "@/components/dashboard/DashboardDataProvider"
import { DASHBOARD_PANEL_SHELL } from "@/components/dashboard/dashboard-panel-layout"
import { cn } from "@/lib/utils"
import { DashboardHeader } from "./DashboardHeader"
import { computeProgress } from "./progress"
import { TaskCard } from "./TaskCard"
import { CreateTaskModal } from "./CreateTaskModal"
import { EditTaskModal } from "./EditTaskModal"
import { TaskDashboardPanelSkeleton } from "./TaskDashboardPanelSkeleton"
import { AppointmentStatus } from "@/lib/schedule/status"
import type { ClinicTask, TaskFilter, TaskFormData, TaskIcon, TaskStatus } from "./types"

let nextId = 100000

function statusToTask(status: string): TaskStatus {
  if (status === AppointmentStatus.Completed || status === AppointmentStatus.Paid) return "completed"
  if (status === AppointmentStatus.InProgress || status === AppointmentStatus.CheckIn) return "in_progress"
  return "pending"
}

function agendaToTasks(agenda: DashboardAgendaItem[]): ClinicTask[] {
  return agenda.map((a) => {
    const status = statusToTask(a.status)
    return {
      id: a.id,
      title: a.patientName,
      description: a.professionalName ? `Atendimento com ${a.professionalName}` : "Atendimento",
      date: a.date,
      time: a.time,
      completed: status === "completed",
      status,
      priority: "medium",
      source: "TimelineAgenda",
      automatic: true,
      icon: "monitor" as TaskIcon,
    }
  })
}

function filterTasks(tasks: ClinicTask[], filter: TaskFilter): ClinicTask[] {
  switch (filter) {
    case "manual":
      return tasks.filter((t) => t.source === "manual")
    case "TimelineAgenda":
      return tasks.filter((t) => t.source === "TimelineAgenda")
    case "completed":
      return tasks.filter((t) => t.status === "completed")
    case "in_progress":
      return tasks.filter((t) => t.status === "in_progress")
    case "pending":
      return tasks.filter((t) => t.status === "pending")
    default:
      return tasks
  }
}

function useTaskDashboardState() {
  const { data } = useDashboard()
  const [tasks, setTasks] = useState<ClinicTask[]>([])
  const [filter, setFilter] = useState<TaskFilter>("all")
  const [createOpen, setCreateOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<ClinicTask | null>(null)

  useEffect(() => {
    if (!data) return
    const fromAgenda = agendaToTasks(data.periodAgenda)
    setTasks((prev) => {
      const manual = prev.filter((t) => t.source === "manual")
      const merged = [...fromAgenda, ...manual]
      nextId = Math.max(100000, ...merged.map((t) => t.id), 0) + 1
      return merged
    })
  }, [data?.period, data?.periodAgenda])

  const filteredTasks = useMemo(() => filterTasks(tasks, filter), [tasks, filter])
  const progress = useMemo(() => computeProgress(tasks), [tasks])

  function handleCreate(data: TaskFormData) {
    const newTask: ClinicTask = {
      id: ++nextId,
      title: data.title,
      description: data.description,
      date: data.date,
      time: data.time,
      priority: data.priority,
      status: data.status,
      source: data.source,
      completed: data.status === "completed",
      automatic: data.source === "TimelineAgenda",
      icon: "monitor" as TaskIcon,
    }
    setTasks((prev) => [newTask, ...prev])
  }

  function handleEdit(id: number, data: TaskFormData) {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id
          ? { ...task, ...data, completed: data.status === "completed" }
          : task
      )
    )
  }

  function handleDelete(id: number) {
    setTasks((prev) => prev.filter((task) => task.id !== id))
  }

  function handleDuplicate(task: ClinicTask) {
    const copy: ClinicTask = {
      ...task,
      id: ++nextId,
      title: `${task.title} (cópia)`,
      automatic: false,
      source: "manual",
      timelineEventId: undefined,
    }
    setTasks((prev) => [copy, ...prev])
  }

  function handleToggleComplete(id: number) {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id !== id) return task
        const completed = task.status !== "completed"
        return {
          ...task,
          completed,
          status: completed ? "completed" : "pending",
        }
      })
    )
  }

  return {
    tasks,
    filter,
    setFilter,
    createOpen,
    setCreateOpen,
    editingTask,
    setEditingTask,
    filteredTasks,
    progress,
    handleCreate,
    handleEdit,
    handleDelete,
    handleDuplicate,
    handleToggleComplete,
  }
}

type TaskDashboardContentProps = {
  compact?: boolean
}

function TaskDashboardContent({ compact = false }: TaskDashboardContentProps) {
  const { loading } = useDashboard()

  if (compact && loading) {
    return <TaskDashboardPanelSkeleton />
  }

  return <TaskDashboardContentLoaded compact={compact} />
}

function TaskDashboardContentLoaded({ compact = false }: TaskDashboardContentProps) {
  const {
    filter,
    setFilter,
    createOpen,
    setCreateOpen,
    editingTask,
    setEditingTask,
    filteredTasks,
    progress,
    tasks,
    handleCreate,
    handleEdit,
    handleDelete,
    handleDuplicate,
    handleToggleComplete,
  } = useTaskDashboardState()

  const { period } = useDashboard()
  const groupByDay = period === "week" || period === "month"

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: compact ? 16 : 0 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: compact ? 0.2 : 0 }}
        className={cn(
          "h-full min-h-0",
          DASHBOARD_PANEL_SHELL,
          "w-full min-w-0 rounded-[20px] border border-gray-200 bg-white p-5 sm:p-6"
        )}
      >
        <div className="shrink-0">
          <DashboardHeader
            compact={compact}
            filter={filter}
            onFilterChange={setFilter}
            taskCount={tasks.length}
          />
        </div>

        <div className="flex min-h-0 flex-1 flex-col">
          <TaskCard
            compact={compact}
            fillHeight={compact}
            groupByDay={compact && groupByDay}
            tasks={filteredTasks}
            completed={progress.completed}
            total={progress.total}
            onAdd={() => setCreateOpen(true)}
            onToggleComplete={handleToggleComplete}
            onEdit={setEditingTask}
            onDelete={handleDelete}
            onDuplicate={handleDuplicate}
          />
        </div>
      </motion.div>

      <CreateTaskModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSave={handleCreate}
      />

      <EditTaskModal
        task={editingTask}
        onClose={() => setEditingTask(null)}
        onSave={handleEdit}
      />
    </>
  )
}

export function TaskDashboardPanel() {
  return <TaskDashboardContent compact />
}
