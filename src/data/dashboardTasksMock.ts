import { timelineEvents } from "@/data/dashboardMock"
import type { ClinicTask, TaskPriority, TaskSource, TaskStatus } from "@/components/task-dashboard/types"

export const progressSegmentsMock = {
  overall: 18,
  segments: [
    { label: "Task", value: 30, color: "#F5CF58" },
    { label: "25%", value: 25, color: "#2F3137" },
    { label: "0%", value: 0, color: "#A9A9A9" },
  ],
} as const

export const initialManualTasks: ClinicTask[] = [
  {
    id: 1,
    title: "Interview",
    description: "Entrevista com candidato à vaga de recepção",
    date: "Sep 13",
    time: "08:30",
    completed: true,
    status: "completed",
    priority: "medium",
    source: "manual",
    automatic: false,
    icon: "monitor",
  },
  {
    id: 2,
    title: "Team Meeting",
    description: "Reunião semanal da equipe clínica",
    date: "Sep 13",
    time: "10:30",
    completed: true,
    status: "completed",
    priority: "high",
    source: "manual",
    automatic: false,
    icon: "zap",
  },
  {
    id: 3,
    title: "Project Update",
    description: "Atualização de projeto — sincronizado da agenda",
    date: "Sep 13",
    time: "13:00",
    completed: false,
    status: "in_progress",
    priority: "medium",
    source: "TimelineAgenda",
    automatic: true,
    icon: "message",
  },
  {
    id: 4,
    title: "Discuss Q3 Goals",
    description: "Discussão de metas do trimestre",
    date: "Sep 13",
    time: "14:45",
    completed: false,
    status: "pending",
    priority: "low",
    source: "manual",
    automatic: false,
    icon: "ruler",
  },
  {
    id: 5,
    title: "HR Policy Review",
    description: "Revisão de políticas — sincronizado da agenda",
    date: "Sep 13",
    time: "16:30",
    completed: false,
    status: "pending",
    priority: "medium",
    source: "TimelineAgenda",
    automatic: true,
    icon: "link",
  },
]

const timelineIconMap: Record<string, ClinicTask["icon"]> = {
  user: "monitor",
  team: "zap",
  lab: "ruler",
  surgery: "message",
  prep: "link",
}

export function timelineEventsToTasks(startId = 1000): ClinicTask[] {
  return timelineEvents.map((event, index) => ({
    id: startId + index,
    title: event.title,
    description: event.subtitle ?? event.location,
    date: "Feb 6",
    time: event.startTime,
    completed: false,
    status: "pending" as TaskStatus,
    priority: "medium" as TaskPriority,
    source: "TimelineAgenda" as TaskSource,
    automatic: true,
    icon: timelineIconMap[event.icon] ?? "monitor",
    timelineEventId: event.id,
  }))
}

export function getInitialTasks(): ClinicTask[] {
  return initialManualTasks
}

export function computeProgress(tasks: ClinicTask[]) {
  const total = tasks.length
  const completed = tasks.filter((t) => t.status === "completed").length
  const inProgress = tasks.filter((t) => t.status === "in_progress").length
  const pending = tasks.filter((t) => t.status === "pending").length

  const overall = total > 0 ? Math.round((completed / total) * 100) : 0
  const completedPct = total > 0 ? Math.round((completed / total) * 100) : 0
  const inProgressPct = total > 0 ? Math.round((inProgress / total) * 100) : 0
  const pendingPct = total > 0 ? Math.round((pending / total) * 100) : 0

  return {
    overall,
    completed,
    total,
    segments: [
      { label: "Task", value: completedPct, color: "#F5CF58" },
      { label: `${inProgressPct}%`, value: inProgressPct, color: "#2F3137" },
      { label: `${pendingPct}%`, value: pendingPct, color: "#A9A9A9" },
    ],
  }
}
