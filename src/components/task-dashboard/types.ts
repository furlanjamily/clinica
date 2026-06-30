export type TaskSource = "manual"
export type TaskStatus = "pending" | "in_progress" | "completed"
export type TaskPriority = "low" | "medium" | "high"
export type TaskIcon = "monitor" | "zap" | "message" | "ruler" | "link" | "calendar" | "stethoscope"

export type ClinicTask = {
  id: number
  title: string
  description?: string
  date: string
  time: string
  completed: boolean
  status: TaskStatus
  priority: TaskPriority
  source: TaskSource
  automatic?: boolean
  icon?: TaskIcon
  timelineEventId?: string
}

export type TaskFormData = {
  title: string
  description: string
  date: string
  time: string
  priority: TaskPriority
  status: TaskStatus
  source: TaskSource
}

export type TaskFilter = "all" | "completed" | "pending" | "in_progress"
