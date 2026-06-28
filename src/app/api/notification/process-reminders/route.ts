import { NextResponse } from "next/server"
import { handleApiError } from "@/lib/errors/error-handler"
import { processDueReminders } from "@/lib/notification/reminder-scheduler"

function isAuthorized(req: Request) {
  const secret = process.env.CRON_SECRET?.trim()
  if (!secret) return true
  const auth = req.headers.get("authorization") ?? ""
  return auth === `Bearer ${secret}`
}

/** Disparado por scheduler externo (GitHub Actions, cron-job.org) ou cron nativo da Vercel Pro. */
export async function GET(req: Request) {
  try {
    if (!isAuthorized(req)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const result = await processDueReminders()
    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    return handleApiError(error)
  }
}
