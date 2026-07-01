"use client"

import { useMemo, useState } from "react"
import { motion } from "framer-motion"
import { useDashboard } from "@/components/dashboard/DashboardDataProvider"
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
import type { ClinicTask, TaskFilter, TaskFormData } from "./types"

function filterTasks(tasks: ClinicTask[], filter: TaskFilter): ClinicTask[] {
  switch (filter) {
    case "pending":
      return tasks.filter((t) => t.status === "pending")
    case "in_progress":
      return tasks.filter((t) => t.status === "in_progress")
    case "completed":
      return tasks.filter((t) => t.status === "completed")
    default:
      return tasks
  }
}

function useTaskDashboardState() {
  const { tasks: manualTasks, createTask, updateTask, deleteTask } = useUserTasks()
  const [filter, setFilter] = useState<TaskFilter>("pending")
  const [createOpen, setCreateOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<ClinicTask | null>(null)

  const tasks = useMemo(
    () => manualTasks.map(toClinicTaskFromUserTask),
    [manualTasks]
  )

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
    if (!task) return

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
    if (!task) return
    await deleteTask(id)
  }

  async function handleDuplicate(task: ClinicTask) {
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
    if (!task) return

    const nextStatus = task.status === "completed" ? "pending" : "completed"
    await updateTask({
      id,
      data: { status: nextStatus },
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
