import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { handleApiError } from "@/lib/errors/error-handler"
import { getTodayYYYYMMDD } from "@/lib/time/tz-date"
import { AppointmentStatus } from "@/lib/schedule/status"
import { startOfLocalDay } from "@/lib/datetime/appointment-time"

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

    const pendingStatuses = [
      AppointmentStatus.Scheduled,
      AppointmentStatus.AwaitingConfirmation,
      AppointmentStatus.Confirmed,
      AppointmentStatus.CheckIn,
      AppointmentStatus.AwaitingPayment,
      AppointmentStatus.Paid,
    ] as const

    const result = await db.appointment.updateMany({
      where: {
        // Dias anteriores ao de hoje — após passar o dia da consulta sem conclusão.
        scheduledStart: { lt: startOfLocalDay(today) },
        status: { in: [...pendingStatuses] },
        deletedAt: null,
      },
      data: { status: AppointmentStatus.Cancelled },
    })

    return NextResponse.json({ success: true, today, cancelled: result.count })
  } catch (err) {
    return handleApiError(err)
  }
}
