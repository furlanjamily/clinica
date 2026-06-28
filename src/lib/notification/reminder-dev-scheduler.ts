import logger from "@/lib/logging/logger"
import { REMINDER_CRON_INTERVAL_MS } from "./reminder-config"
import { processDueReminders } from "./reminder-scheduler"

let started = false

/** Em dev local (`npm run dev`), dispara lembretes a cada 5 min — substitui o GitHub Actions. */
export function startDevReminderScheduler() {
  if (started || process.env.NODE_ENV === "production") return
  started = true

  const tick = async () => {
    try {
      const result = await processDueReminders()
      const total = result.appointments + result.tasks
      if (total > 0) {
        logger.info({ ...result }, "Lembretes processados (dev scheduler)")
      }
    } catch (err) {
      logger.error({ err }, "Falha ao processar lembretes (dev scheduler)")
    }
  }

  setInterval(tick, REMINDER_CRON_INTERVAL_MS)
  setTimeout(tick, 30_000)

  logger.info(
    { intervalMinutes: REMINDER_CRON_INTERVAL_MS / 60_000 },
    "Scheduler de lembretes ativo (somente dev)"
  )
}
