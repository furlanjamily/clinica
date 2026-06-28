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
        logger.info(
          `Lembretes processados (dev scheduler): ${result.appointments} consultas, ${result.tasks} tarefas`
        )
      }
    } catch (err) {
      logger.error("Falha ao processar lembretes (dev scheduler)", err)
    }
  }

  setInterval(tick, REMINDER_CRON_INTERVAL_MS)
  setTimeout(tick, 30_000)

  logger.info(
    `Scheduler de lembretes ativo (somente dev, a cada ${REMINDER_CRON_INTERVAL_MS / 60_000} min)`
  )
}
