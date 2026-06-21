import { NextResponse, type NextRequest } from "next/server"
import { db } from "@/lib/db"
import { requireSession } from "@/lib/auth/api-guard"
import { resolveDoctorForSession } from "@/lib/auth/session-doctor"
import { handleApiError } from "@/lib/errors/error-handler"
import { AppointmentStatus, STATUS_LABEL } from "@/lib/schedule/status"
import {
  startOfLocalDay,
  startOfNextLocalDay,
  toLocalDate,
  toLocalSlotTime,
} from "@/lib/datetime/appointment-time"
import { getTodayYYYYMMDD } from "@/lib/time/tz-date"

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]
const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
]

const DONE = [AppointmentStatus.Completed, AppointmentStatus.Paid]
const IN_PROGRESS = [AppointmentStatus.InProgress, AppointmentStatus.CheckIn]
const PENDING = [
  AppointmentStatus.Scheduled,
  AppointmentStatus.AwaitingConfirmation,
  AppointmentStatus.Confirmed,
]

type Period = "today" | "week" | "month"
const PERIOD_LABEL: Record<Period, string> = {
  today: "hoje",
  week: "esta semana",
  month: "este mês",
}

function parsePeriod(value: string | null): Period {
  if (value === "today" || value === "week" || value === "month") return value
  return "month"
}

function addDaysStr(date: string, days: number): string {
  const d = startOfLocalDay(date)
  return toLocalDate(new Date(d.getTime() + days * 86400000))
}

function ageFrom(birthDate: string | null): number | null {
  if (!birthDate) return null
  const b = new Date(birthDate)
  if (Number.isNaN(b.getTime())) return null
  const now = new Date()
  let age = now.getFullYear() - b.getFullYear()
  const m = now.getMonth() - b.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--
  return age >= 0 && age < 130 ? age : null
}

function buildWeekCalendar(
  weekDates: string[],
  today: string,
  countMap: Map<string, number>,
  inPeriod: (date: string) => boolean,
) {
  return weekDates.map((d) => {
    const dayNum = Number(d.slice(8, 10))
    const dow = startOfLocalDay(d).getUTCDay()
    return {
      date: d,
      weekday: WEEKDAYS[dow],
      day: dayNum,
      count: inPeriod(d) ? (countMap.get(d) ?? 0) : 0,
      isToday: d === today,
      inPeriod: inPeriod(d),
    }
  })
}

function buildMonthCalendar(y: number, m: number, today: string, countMap: Map<string, number>) {
  const pad = (n: number) => String(n).padStart(2, "0")
  const firstDay = `${y}-${pad(m)}-01`
  const daysInMonth = new Date(y, m, 0).getDate()
  const startDow = startOfLocalDay(firstDay).getUTCDay()
  const cells: {
    date: string | null
    weekday: string | null
    day: number | null
    count: number
    isToday: boolean
    inPeriod: boolean
  }[] = []

  for (let i = 0; i < startDow; i++) {
    cells.push({ date: null, weekday: null, day: null, count: 0, isToday: false, inPeriod: false })
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${y}-${pad(m)}-${pad(d)}`
    const dow = startOfLocalDay(dateStr).getUTCDay()
    cells.push({
      date: dateStr,
      weekday: WEEKDAYS[dow],
      day: d,
      count: countMap.get(dateStr) ?? 0,
      isToday: dateStr === today,
      inPeriod: true,
    })
  }

  return cells
}

export async function GET(request: NextRequest) {
  try {
    const session = await requireSession()
    const sessionDoctor = await resolveDoctorForSession(session)

    const period = parsePeriod(request.nextUrl.searchParams.get("period"))
    const today = getTodayYYYYMMDD()
    const [y, m] = today.split("-").map(Number)
    const pad = (n: number) => String(n).padStart(2, "0")

    const todayStart = startOfLocalDay(today)
    const todayEnd = startOfNextLocalDay(today)

    const todayDow = startOfLocalDay(today).getUTCDay()
    const mondayOffset = todayDow === 0 ? -6 : 1 - todayDow
    const weekStartStr = addDaysStr(today, mondayOffset)
    const weekDates = Array.from({ length: 7 }, (_, i) => addDaysStr(weekStartStr, i))
    const weekStart = startOfLocalDay(weekDates[0])
    const weekEnd = startOfNextLocalDay(weekDates[6])

    let rangeStart: Date
    let rangeEnd: Date
    let prevStart: Date
    let prevEnd: Date
    if (period === "today") {
      rangeStart = todayStart
      rangeEnd = todayEnd
      prevStart = startOfLocalDay(addDaysStr(today, -1))
      prevEnd = todayStart
    } else if (period === "week") {
      rangeStart = weekStart
      rangeEnd = weekEnd
      prevStart = startOfLocalDay(addDaysStr(weekStartStr, -7))
      prevEnd = weekStart
    } else {
      const nextMonthStr = m === 12 ? `${y + 1}-01` : `${y}-${pad(m + 1)}`
      const prevMonthStr = m === 1 ? `${y - 1}-12` : `${y}-${pad(m - 1)}`
      rangeStart = startOfLocalDay(`${y}-${pad(m)}-01`)
      rangeEnd = startOfLocalDay(`${nextMonthStr}-01`)
      prevStart = startOfLocalDay(`${prevMonthStr}-01`)
      prevEnd = rangeStart
    }

    const [
      newPatientsRange,
      completedRange,
      completedPrev,
      scheduledInRange,
      cancelledRange,
      recordsRange,
      revenueAgg,
      revenuePrevAgg,
      statusGroups,
      calendarRows,
      agendaRows,
      patientsInRangeGroups,
      topDoctor,
      lastRecord,
    ] = await Promise.all([
      db.patient.count({ where: { deletedAt: null, createdAt: { gte: rangeStart, lt: rangeEnd } } }),
      db.appointment.count({
        where: { deletedAt: null, status: { in: DONE }, scheduledStart: { gte: rangeStart, lt: rangeEnd } },
      }),
      db.appointment.count({
        where: { deletedAt: null, status: { in: DONE }, scheduledStart: { gte: prevStart, lt: prevEnd } },
      }),
      db.appointment.count({
        where: { deletedAt: null, status: { in: PENDING }, scheduledStart: { gte: rangeStart, lt: rangeEnd } },
      }),
      db.appointment.count({
        where: { deletedAt: null, status: AppointmentStatus.Cancelled, scheduledStart: { gte: rangeStart, lt: rangeEnd } },
      }),
      db.medicalRecord.count({ where: { deletedAt: null, createdAt: { gte: rangeStart, lt: rangeEnd } } }),
      db.transaction.aggregate({
        _sum: { amount: true },
        where: { deletedAt: null, type: "Receita", status: "Confirmado", competenceDate: { gte: rangeStart, lt: rangeEnd } },
      }),
      db.transaction.aggregate({
        _sum: { amount: true },
        where: { deletedAt: null, type: "Receita", status: "Confirmado", competenceDate: { gte: prevStart, lt: prevEnd } },
      }),
      db.appointment.groupBy({
        by: ["status"],
        _count: true,
        where: { deletedAt: null, scheduledStart: { gte: rangeStart, lt: rangeEnd } },
      }),
      db.appointment.findMany({
        where: {
          deletedAt: null,
          status: { not: AppointmentStatus.Cancelled },
          scheduledStart: { gte: rangeStart, lt: rangeEnd },
        },
        select: { scheduledStart: true },
      }),
      db.appointment.findMany({
        where: { deletedAt: null, scheduledStart: { gte: rangeStart, lt: rangeEnd } },
        orderBy: { scheduledStart: "asc" },
        select: {
          id: true,
          scheduledStart: true,
          scheduledEnd: true,
          status: true,
          patientNameSnapshot: true,
          professionalNameSnapshot: true,
          patient: { select: { name: true } },
          doctor: { select: { name: true } },
        },
      }),
      db.appointment.groupBy({
        by: ["patientId"],
        where: { deletedAt: null, scheduledStart: { gte: rangeStart, lt: rangeEnd } },
      }),
      db.appointment.groupBy({
        by: ["doctorId"],
        _count: true,
        where: { deletedAt: null, status: { in: DONE }, scheduledStart: { gte: rangeStart, lt: rangeEnd } },
        orderBy: { _count: { doctorId: "desc" } },
        take: 1,
      }),
      db.medicalRecord.findFirst({
        where: {
          deletedAt: null,
          ...(sessionDoctor
            ? { appointment: { doctorId: sessionDoctor.id } }
            : {}),
          OR: [
            { createdAt: { gte: rangeStart, lt: rangeEnd } },
            { appointment: { scheduledStart: { gte: rangeStart, lt: rangeEnd } } },
          ],
        },
        orderBy: { createdAt: "desc" },
        include: {
          patient: true,
          appointment: {
            select: { scheduledStart: true, professionalNameSnapshot: true },
          },
          prescriptions: { include: { items: true } },
        },
      }),
    ])

    const patientsInRange = patientsInRangeGroups.length
    const revenueRange = Number(revenueAgg._sum.amount ?? 0)
    const revenuePrev = Number(revenuePrevAgg._sum.amount ?? 0)
    const totalRange = completedRange + cancelledRange
    const attendanceRate = totalRange > 0 ? Math.round((completedRange / totalRange) * 100) : 0
    const pct = (curr: number, prev: number) =>
      prev > 0 ? Math.round(((curr - prev) / prev) * 100) : null

    const countOf = (list: string[]) =>
      statusGroups
        .filter((g) => (list as string[]).includes(g.status))
        .reduce((acc, g) => acc + g._count, 0)
    const done = countOf(DONE)
    const inProgress = countOf(IN_PROGRESS)
    const pending = countOf(PENDING)
    const sum = done + inProgress + pending || 1
    const statusBreakdown = {
      completed: Math.round((done / sum) * 100),
      inProgress: Math.round((inProgress / sum) * 100),
      pending: Math.round((pending / sum) * 100),
      totalProgress: Math.round((done / sum) * 100),
      counts: { completed: done, inProgress, pending },
    }

    const countMap = new Map<string, number>()
    for (const r of calendarRows) {
      const d = toLocalDate(r.scheduledStart)
      countMap.set(d, (countMap.get(d) ?? 0) + 1)
    }

    const calendarMode = period === "month" ? "month" : "week"
    const calendarLabel =
      period === "today"
        ? `Hoje — ${today.split("-").reverse().join("/")}`
        : period === "week"
          ? `Semana ${weekDates[0].split("-").reverse().slice(0, 2).join("/")} – ${weekDates[6].split("-").reverse().slice(0, 2).join("/")}`
          : `${MONTHS[m - 1]} ${y}`

    const inPeriod = (date: string) => {
      const d = startOfLocalDay(date).getTime()
      return d >= rangeStart.getTime() && d < rangeEnd.getTime()
    }

    const calendar =
      period === "month"
        ? buildMonthCalendar(y, m, today, countMap)
        : buildWeekCalendar(weekDates, today, countMap, inPeriod)

    const periodAgenda = agendaRows.map((r) => ({
      id: r.id,
      date: toLocalDate(r.scheduledStart),
      time: toLocalSlotTime(r.scheduledStart),
      endTime: r.scheduledEnd ? toLocalSlotTime(r.scheduledEnd) : null,
      patientName: r.patient?.name ?? r.patientNameSnapshot ?? "Paciente",
      professionalName: r.doctor?.name ?? r.professionalNameSnapshot ?? "",
      status: r.status,
      statusLabel: STATUS_LABEL[r.status] ?? r.status,
    }))

    let featuredDoctor: {
      name: string
      specialty: string
      qualification: string | null
      shift: string | null
      completedCount: number
    } | null = null
    if (topDoctor.length > 0) {
      const doc = await db.doctor.findUnique({
        where: { id: topDoctor[0].doctorId },
        include: { specialty: true },
      })
      if (doc) {
        featuredDoctor = {
          name: doc.name,
          specialty: doc.specialty?.name ?? "Clínica",
          qualification: doc.crm ? `CRM ${doc.crm}` : doc.specialty?.name ?? null,
          shift: doc.shift,
          completedCount: topDoctor[0]._count,
        }
      }
    }

    let lastVisit: {
      patientName: string
      demographics: string
      patientId: string
      lastChecked: { doctor: string; date: string }
      diagnosis: string | null
      observation: string | null
      conduct: string | null
      prescriptions: { drug: string; instruction: string }[]
    } | null = null
    if (lastRecord) {
      const p = lastRecord.patient
      const age = ageFrom(p?.birthDate ? p.birthDate.toISOString().slice(0, 10) : null)
      const demoParts = [p?.sex ?? lastRecord.gender, age != null ? `${age} anos` : null].filter(Boolean)
      const visitDate = lastRecord.appointment?.scheduledStart
        ? toLocalDate(lastRecord.appointment.scheduledStart)
        : toLocalDate(lastRecord.createdAt)
      const rxs = lastRecord.prescriptions.flatMap((rx) =>
        rx.items.map((it) => ({
          drug: it.drug,
          instruction: [it.dosage, it.instructions].filter(Boolean).join(" — "),
        }))
      )
      lastVisit = {
        patientName: p?.name ?? lastRecord.patientLabel ?? "Paciente",
        demographics: demoParts.join(", "),
        patientId: `#${String(p?.id ?? lastRecord.patientId).padStart(5, "0")}`,
        lastChecked: {
          doctor: lastRecord.appointment?.professionalNameSnapshot ?? lastRecord.psychologist ?? "—",
          date: visitDate,
        },
        diagnosis: lastRecord.clinicalDiagnosis,
        observation: lastRecord.psychicExam ?? lastRecord.personalHistory,
        conduct: lastRecord.psychologicalConduct,
        prescriptions: rxs,
      }
    }

    return NextResponse.json({
      period,
      periodLabel: PERIOD_LABEL[period],
      kpis: {
        patientsInRange,
        newPatientsRange,
        completedRange,
        completedGrowthPct: pct(completedRange, completedPrev),
        scheduledInRange,
        cancelledRange,
        recordsRange,
        revenueRange,
        revenueGrowthPct: pct(revenueRange, revenuePrev),
        attendanceRate,
      },
      calendarLabel,
      calendarMode,
      calendar,
      periodAgenda,
      featuredDoctor,
      lastVisit,
      statusBreakdown,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
