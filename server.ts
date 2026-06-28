import { createServer } from "node:http"
import { parse } from "node:url"
import next from "next"
import { initializeSocketServer } from "./src/lib/chat/socket-server"
import logger from "./src/lib/logging/logger"

const dev = process.env.NODE_ENV !== "production"
const hostname = process.env.HOSTNAME ?? "localhost"
const port = parseInt(process.env.PORT ?? "3000", 10)

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url ?? "", true)
    handle(req, res, parsedUrl)
  })

  initializeSocketServer({ httpServer })

  httpServer.listen(port, () => {
    logger.info(`ClinySOFT ready on http://${hostname}:${port}`)

    if (dev) {
      void import("./src/lib/notification/reminder-dev-scheduler").then(
        ({ startDevReminderScheduler }) => startDevReminderScheduler()
      )
    }
  })
})
