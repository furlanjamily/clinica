import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireSession } from "@/lib/auth/api-guard"
import { handleApiError } from "@/lib/errors/error-handler"
import { AppointmentStatus } from "@/lib/schedule/status"
import { startOfLocalDay } from "@/lib/datetime/appointment-time"
import { getTodayYYYYMMDD } from "@/lib/time/tz-date"

export async function GET() {
  try {
    await requireSession()

    const today = getTodayYYYYMMDD()
    const [y, m] = today.split("-").map(Number)
    const pad = (n: number) => String(n).padStart(2, "0")

    const monthStart = startOfLocalDay(`${y}-${pad(m)}-01`)
    const nextMonth = m === 12 ? `${y + 1}-01` : `${y}-${pad(m + 1)}`
    const monthEnd = startOfLocalDay(`${nextMonth}-01`)
    const prevMonth = m === 1 ? `${y - 1}-12` : `${y}-${pad(m - 1)}`
    const prevStart = startOfLocalDay(`${prevMonth}-01`)
    const now = new Date()

    const [
      totalPatients,
      newPatientsMonth,
      completedMonth,
      completedPrev,
      scheduledUpcoming,
      cancelledMonth,
      recordsMonth,
      revenueAgg,
      revenuePrevAgg,
    ] = await Promise.all([
      db.patient.count({ where: { deletedAt: null } }),
      db.patient.count({
        where: { deletedAt: null, createdAt: { gte: monthStart, lt: monthEnd } },
      }),
      db.appointment.count({
        where: {
          deletedAt: null,
          status: { in: [AppointmentStatus.Completed, AppointmentStatus.Paid] },
          scheduledStart: { gte: monthStart, lt: monthEnd },
        },
      }),
      db.appointment.count({
        where: {
          deletedAt: null,
          status: { in: [AppointmentStatus.Completed, AppointmentStatus.Paid] },
          scheduledStart: { gte: prevStart, lt: monthStart },
        },
      }),
      db.appointment.count({
        where: {
          deletedAt: null,
          status: {
            in: [
              AppointmentStatus.Scheduled,
              AppointmentStatus.AwaitingConfirmation,
              AppointmentStatus.Confirmed,
            ],
          },
          scheduledStart: { gte: now },
        },
      }),
      db.appointment.count({
        where: {
          deletedAt: null,
          status: AppointmentStatus.Cancelled,
          scheduledStart: { gte: monthStart, lt: monthEnd },
        },
      }),
      db.medicalRecord.count({
        where: { deletedAt: null, createdAt: { gte: monthStart, lt: monthEnd } },
      }),
      db.transaction.aggregate({
        _sum: { amount: true },
        where: {
          deletedAt: null,
          type: "Receita",
          status: "Confirmado",
          competenceDate: { gte: monthStart, lt: monthEnd },
        },
      }),
      db.transaction.aggregate({
        _sum: { amount: true },
        where: {
          deletedAt: null,
          type: "Receita",
          status: "Confirmado",
          competenceDate: { gte: prevStart, lt: monthStart },
        },
      }),
    ])

    const revenueMonth = Number(revenueAgg._sum.amount ?? 0)
    const revenuePrev = Number(revenuePrevAgg._sum.amount ?? 0)

    const totalMonth = completedMonth + cancelledMonth
    const attendanceRate = totalMonth > 0 ? Math.round((completedMonth / totalMonth) * 100) : 0

    const pct = (curr: number, prev: number) =>
      prev > 0 ? Math.round(((curr - prev) / prev) * 100) : null

    return NextResponse.json({
      totalPatients,
      newPatientsMonth,
      completedMonth,
      completedGrowthPct: pct(completedMonth, completedPrev),
      scheduledUpcoming,
      cancelledMonth,
      recordsMonth,
      revenueMonth,
      revenueGrowthPct: pct(revenueMonth, revenuePrev),
      attendanceRate,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
