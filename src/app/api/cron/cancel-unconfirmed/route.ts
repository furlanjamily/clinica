import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { handleApiError } from "@/lib/errors/error-handler"
import { getTodayYYYYMMDD } from "@/lib/time/tz-date"

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
        date: { lte: today },
        status: { in: ["Agendado", "AguardandoConfirmacao"] },
      },
      data: { status: "Cancelado" },
    })

    return NextResponse.json({ success: true, today, cancelled: result.count })
  } catch (err) {
    return handleApiError(err)
  }
}
