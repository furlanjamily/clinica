import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { handleApiError } from "@/lib/errors/error-handler"
import { getTodayYYYYMMDD } from "@/lib/time/tz-date"
import { AppointmentStatus } from "@/lib/schedule/status"
import { startOfNextLocalDay } from "@/lib/datetime/appointment-time"

function isAuthorized(req: Request) {
  const secret = process.env.CRON_SECRET?.trim()
  if (!secret) return true
  const auth = req.headers.get("authorization") ?? ""
  return auth === `Bearer ${secret}`
}

export async function GET(req: Request) {
  try {
    if (!isAuthorized(req)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const today = getTodayYYYYMMDD()

    const result = await db.appointment.updateMany({
      where: {
        // Inclui o dia de hoje: tudo agendado antes do início de amanhã.
        scheduledStart: { lt: startOfNextLocalDay(today) },
        status: { in: [AppointmentStatus.Scheduled, AppointmentStatus.AwaitingConfirmation] },
        deletedAt: null,
      },
      data: { status: AppointmentStatus.Cancelled },
    })

    return NextResponse.json({ success: true, today, cancelled: result.count })
  } catch (err) {
    return handleApiError(err)
  }
}
