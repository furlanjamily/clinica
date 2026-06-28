import { describe, expect, it } from "vitest"
import {
  formatTaskReminderAction,
  getReminderTriggerWindow,
  minutesUntil,
  REMINDER_CRON_INTERVAL_MINUTES,
  REMINDER_LEAD_MINUTES,
} from "@/lib/notification/reminder-config"

describe("reminder-config", () => {
  it("janela de disparo cobre lead menos intervalo do cron", () => {
    const now = new Date("2026-06-27T10:00:00.000Z")
    const { windowStart, windowEnd } = getReminderTriggerWindow(now)

    expect(windowEnd.getTime() - now.getTime()).toBe(REMINDER_LEAD_MINUTES * 60_000)
    expect(windowEnd.getTime() - windowStart.getTime()).toBe(
      REMINDER_CRON_INTERVAL_MINUTES * 60_000
    )
  })

  it("tarefa due em 15 min entra na janela no tick certo", () => {
    const now = new Date("2026-06-27T10:00:00.000Z")
    const dueAt = new Date(now.getTime() + 15 * 60_000)
    const { windowStart, windowEnd } = getReminderTriggerWindow(now)

    expect(dueAt >= windowStart && dueAt <= windowEnd).toBe(true)
    expect(formatTaskReminderAction(minutesUntil(now, dueAt))).toBe(
      "não se esqueça! Sua próxima tarefa começa em 15 minutos"
    )
  })

  it("tarefa due em 8 min não entra na janela (ainda cedo demais)", () => {
    const now = new Date("2026-06-27T10:00:00.000Z")
    const dueAt = new Date(now.getTime() + 8 * 60_000)
    const { windowStart, windowEnd } = getReminderTriggerWindow(now)

    expect(dueAt >= windowStart && dueAt <= windowEnd).toBe(false)
  })

  it("tarefa due em 20 min não entra na janela (ainda longe)", () => {
    const now = new Date("2026-06-27T10:00:00.000Z")
    const dueAt = new Date(now.getTime() + 20 * 60_000)
    const { windowStart, windowEnd } = getReminderTriggerWindow(now)

    expect(dueAt >= windowStart && dueAt <= windowEnd).toBe(false)
  })
})
