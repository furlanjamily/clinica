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

    // Regra: se chegou no dia da consulta e ainda não confirmou, cancela.
    // (equivalente a "até o dia anterior": ao virar o dia, cancela pendentes)
    const result = await db.agendamento.updateMany({
      where: {
        data: { lte: today },
        status: { in: ["Agendado", "AguardandoConfirmacao"] },
      },
      data: { status: "Cancelado" },
    })

    return NextResponse.json({ success: true, today, cancelled: result.count })
  } catch (err) {
    return handleApiError(err)
  }
}

