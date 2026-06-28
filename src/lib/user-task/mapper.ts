import type { UserTask } from "@/generated/prisma/client"
import { combineLocalDateTime, toLocalDate, toLocalSlotTime } from "@/lib/datetime/appointment-time"
import type { ClinicTask, TaskIcon, TaskPriority, TaskStatus } from "@/components/task-dashboard/types"

export type UserTaskDTO = {
  id: number
  title: string
  description: string | null
  date: string
  time: string
  status: TaskStatus
  priority: TaskPriority
}

export function toUserTaskDTO(task: UserTask): UserTaskDTO {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    date: toLocalDate(task.dueAt),
    time: toLocalSlotTime(task.dueAt),
    status: task.status as TaskStatus,
    priority: task.priority as TaskPriority,
  }
}

export function toClinicTaskFromUserTask(task: UserTaskDTO): ClinicTask {
  return {
    id: task.id,
    title: task.title,
    description: task.description ?? undefined,
    date: task.date,
    time: task.time,
    completed: task.status === "completed",
    status: task.status,
    priority: task.priority,
    source: "manual",
    automatic: false,
    icon: "monitor" as TaskIcon,
  }
}

export function dueAtFromDateTime(date: string, time: string): Date {
  return combineLocalDateTime(date, time)
}
