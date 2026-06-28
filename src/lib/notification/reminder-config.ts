/** Minutos antes do horário para disparar o lembrete. */
export const REMINDER_LEAD_MINUTES = 15

/** Intervalo do scheduler (GitHub Actions: a cada 5 minutos). */
export const REMINDER_CRON_INTERVAL_MINUTES = 5

export const REMINDER_LEAD_MS = REMINDER_LEAD_MINUTES * 60 * 1000

export const REMINDER_CRON_INTERVAL_MS =
  REMINDER_CRON_INTERVAL_MINUTES * 60 * 1000

/** Evita lembrete duplicado para o mesmo evento no mesmo dia. */
export const REMINDER_DEDUPE_WINDOW_MS = 24 * 60 * 60 * 1000

/**
 * Janela de dueAt para o tick atual do cron.
 * Ex.: lead 15 min + cron 5 min → dispara só quando faltam entre 10 e 15 min.
 */
export function getReminderTriggerWindow(now: Date = new Date()) {
  const windowEnd = new Date(now.getTime() + REMINDER_LEAD_MS)
  const windowStart = new Date(
    now.getTime() + REMINDER_LEAD_MS - REMINDER_CRON_INTERVAL_MS
  )
  return { windowStart, windowEnd }
}

export function minutesUntil(from: Date, to: Date): number {
  return Math.max(1, Math.round((to.getTime() - from.getTime()) / 60_000))
}

function formatMinutesLabel(minutes: number): string {
  const n = Math.max(1, Math.round(minutes))
  return n === 1 ? "1 minuto" : `${n} minutos`
}

export function formatTaskReminderAction(minutesUntilDue: number): string {
  return `não se esqueça! Sua próxima tarefa começa em ${formatMinutesLabel(minutesUntilDue)}`
}

export function formatAppointmentReminderAction(minutesUntilDue: number): string {
  const n = Math.round(minutesUntilDue)
  if (n <= 5) return "sua consulta começa em breve"
  return `sua consulta começa em ${formatMinutesLabel(n)}`
}
