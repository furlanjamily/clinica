import type { ClinicTask } from "./types"

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
