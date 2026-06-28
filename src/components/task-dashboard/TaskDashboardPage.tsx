"use client"

import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import { useDashboard, type DashboardAgendaItem } from "@/components/dashboard/DashboardDataProvider"
import { DASHBOARD_PANEL_SHELL } from "@/components/dashboard/dashboard-panel-layout"
import { cn } from "@/lib/utils"
import { toClinicTaskFromUserTask } from "@/lib/user-task/mapper"
import { useUserTasks } from "@/hooks/useUserTasks"
import { DashboardHeader } from "./DashboardHeader"
import { computeProgress } from "./progress"
import { TaskCard } from "./TaskCard"
import { CreateTaskModal } from "./CreateTaskModal"
import { EditTaskModal } from "./EditTaskModal"
import { TaskDashboardPanelSkeleton } from "./TaskDashboardPanelSkeleton"
import { AppointmentStatus } from "@/lib/schedule/status"
import type { ClinicTask, TaskFilter, TaskFormData, TaskIcon, TaskStatus } from "./types"

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
  const { tasks: manualTasks, createTask, updateTask, deleteTask } = useUserTasks()
  const [filter, setFilter] = useState<TaskFilter>("all")
  const [createOpen, setCreateOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<ClinicTask | null>(null)

  const tasks = useMemo(() => {
    const fromAgenda = data ? agendaToTasks(data.periodAgenda) : []
    const manual = manualTasks.map(toClinicTaskFromUserTask)
    return [...fromAgenda, ...manual]
  }, [data?.periodAgenda, manualTasks])

  const filteredTasks = useMemo(() => filterTasks(tasks, filter), [tasks, filter])
  const progress = useMemo(() => computeProgress(tasks), [tasks])

  async function handleCreate(form: TaskFormData) {
    await createTask({
      title: form.title,
      description: form.description,
      date: form.date,
      time: form.time,
      priority: form.priority,
      status: form.status,
    })
  }

  async function handleEdit(id: number, form: TaskFormData) {
    const task = tasks.find((item) => item.id === id)
    if (!task || task.source !== "manual") return

    await updateTask({
      id,
      data: {
        title: form.title,
        description: form.description,
        date: form.date,
        time: form.time,
        priority: form.priority,
        status: form.status,
      },
    })
  }

  async function handleDelete(id: number) {
    const task = tasks.find((item) => item.id === id)
    if (!task || task.source !== "manual") return
    await deleteTask(id)
  }

  async function handleDuplicate(task: ClinicTask) {
    if (task.source !== "manual") return
    await createTask({
      title: `${task.title} (cópia)`,
      description: task.description ?? "",
      date: task.date,
      time: task.time,
      priority: task.priority,
      status: task.status,
    })
  }

  async function handleToggleComplete(id: number) {
    const task = tasks.find((item) => item.id === id)
    if (!task || task.source !== "manual") return

    const completed = task.status !== "completed"
    await updateTask({
      id,
      data: { status: completed ? "completed" : "pending" },
    })
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
