import { NextResponse, type NextRequest } from "next/server"
import { db } from "@/lib/db"
import { requireSession } from "@/lib/auth/api-guard"
import {
  appointmentDoctorWhere,
  medicalRecordDoctorWhere,
  patientDoctorWhere,
  resolveAppointmentDoctorFilter,
  transactionDoctorWhere,
} from "@/lib/auth/appointment-scope"
import { handleApiError } from "@/lib/errors/error-handler"
import { AppointmentStatus, STATUS_LABEL } from "@/lib/schedule/status"
import { TransactionStatus, TransactionType } from "@/lib/finance/types"
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

type Period = "day" | "week" | "month"
const PERIOD_LABEL: Record<Period, string> = {
  day: "no dia",
  week: "na semana",
  month: "no mês",
}

function parsePeriod(value: string | null): Period {
  if (value === "day" || value === "today" || value === "week" || value === "month") {
    return value === "today" ? "day" : value
  }
  return "day"
}

function parseReferenceDate(value: string | null, fallback: string): string {
  if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value
  return fallback
}

function addDaysStr(date: string, days: number): string {
  const d = startOfLocalDay(date)
  return toLocalDate(new Date(d.getTime() + days * 86400000))
}

function addMonthsStr(date: string, months: number): string {
  const [y, m, d] = date.split("-").map(Number)
  const dt = new Date(y, m - 1 + months, d)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`
}

function weekDatesFrom(date: string): string[] {
  const dow = startOfLocalDay(date).getUTCDay()
  const mondayOffset = dow === 0 ? -6 : 1 - dow
  const weekStartStr = addDaysStr(date, mondayOffset)
  return Array.from({ length: 7 }, (_, i) => addDaysStr(weekStartStr, i))
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

const DEFAULT_SLOT_MS = 30 * 60 * 1000

type AgendaFocusRow = {
  id: number
  patientId: number
  scheduledStart: Date
  scheduledEnd: Date | null
  status: string
  patientNameSnapshot: string | null
  patient: { id: number; name: string; birthDate: Date | null; sex: string | null } | null
}

function appointmentEnd(row: Pick<AgendaFocusRow, "scheduledStart" | "scheduledEnd">): Date {
  return row.scheduledEnd ?? new Date(row.scheduledStart.getTime() + DEFAULT_SLOT_MS)
}

function isWithinAppointmentSlot(
  row: Pick<AgendaFocusRow, "scheduledStart" | "scheduledEnd">,
  now: Date,
): boolean {
  const t = now.getTime()
  return t >= row.scheduledStart.getTime() && t < appointmentEnd(row).getTime()
}

function isDoneStatus(status: string): boolean {
  return (DONE as string[]).includes(status)
}

type FocusPick = { row: AgendaFocusRow; context: "in_progress" | "in_slot" | "next" | "day_first" | "fallback" }

function pickFocusAppointment(
  rows: AgendaFocusRow[],
  now: Date,
  referenceDate: string,
  today: string,
): FocusPick | null {
  const active = rows
    .filter((r) => r.status !== AppointmentStatus.Cancelled)
    .sort((a, b) => a.scheduledStart.getTime() - b.scheduledStart.getTime())

  if (active.length === 0) return null

  const inProgress = active.find((r) => r.status === AppointmentStatus.InProgress)
  if (inProgress) return { row: inProgress, context: "in_progress" }

  const inSlotActive = active.find(
    (r) =>
      isWithinAppointmentSlot(r, now) &&
      (r.status === AppointmentStatus.InProgress || r.status === AppointmentStatus.CheckIn),
  )
  if (inSlotActive) return { row: inSlotActive, context: "in_slot" }

  const inSlot = active.find(
    (r) => isWithinAppointmentSlot(r, now) && !isDoneStatus(r.status),
  )
  if (inSlot) return { row: inSlot, context: "in_slot" }

  const upcoming = active.find(
    (r) => r.scheduledStart.getTime() >= now.getTime() && !isDoneStatus(r.status),
  )
  if (upcoming) return { row: upcoming, context: "next" }

  if (referenceDate !== today) {
    const dayRows = active.filter((r) => toLocalDate(r.scheduledStart) === referenceDate)
    if (dayRows.length > 0) return { row: dayRows[0], context: "day_first" }
  }

  const notDone = active.filter((r) => !isDoneStatus(r.status))
  if (notDone.length > 0) return { row: notDone[0], context: "fallback" }

  return { row: active[0], context: "fallback" }
}

const FOCUS_CONTEXT_LABEL: Record<FocusPick["context"], string> = {
  in_progress: "Em atendimento",
  in_slot: "Horário da consulta",
  next: "Próxima consulta",
  day_first: "Consulta do período",
  fallback: "Agendamento",
}

function buildLastVisitFromRecord(
  lastRecord: {
    patient: { id: number; name: string; birthDate: Date | null; sex: string | null } | null
    patientId: number
    patientLabel: string | null
    gender: string | null
    clinicalDiagnosis: string | null
    psychicExam: string | null
    personalHistory: string | null
    psychologicalConduct: string | null
    psychologist: string | null
    createdAt: Date
    appointment: { scheduledStart: Date; professionalNameSnapshot: string | null } | null
    prescriptions: { items: { drug: string; dosage: string | null; instructions: string | null }[] }[]
  },
) {
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
    })),
  )
  return {
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

function buildPatientDemographics(patient: {
  birthDate: Date | null
  sex: string | null
} | null): string {
  if (!patient) return ""
  const age = ageFrom(patient.birthDate ? patient.birthDate.toISOString().slice(0, 10) : null)
  return [patient.sex, age != null ? `${age} anos` : null].filter(Boolean).join(", ")
}

function buildWeekCalendar(
  weekDates: string[],
  today: string,
  selectedDate: string,
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
      isSelected: d === selectedDate,
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
    isSelected: boolean
    inPeriod: boolean
  }[] = []

  for (let i = 0; i < startDow; i++) {
    cells.push({
      date: null,
      weekday: null,
      day: null,
      count: 0,
      isToday: false,
      isSelected: false,
      inPeriod: false,
    })
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
      isSelected: false,
      inPeriod: true,
    })
  }

  return cells
}

export async function GET(request: NextRequest) {
  try {
    const session = await requireSession()
    const doctorFilter = await resolveAppointmentDoctorFilter(session)
    const apptScope = appointmentDoctorWhere(doctorFilter)
    const txScope = transactionDoctorWhere(doctorFilter)
    const recordScope = medicalRecordDoctorWhere(doctorFilter)
    const patientScope = patientDoctorWhere(doctorFilter)

    const period = parsePeriod(request.nextUrl.searchParams.get("period"))
    const today = getTodayYYYYMMDD()
    const referenceDate = parseReferenceDate(request.nextUrl.searchParams.get("date"), today)
    const [refY, refM] = referenceDate.split("-").map(Number)
    const pad = (n: number) => String(n).padStart(2, "0")

    const weekDates = weekDatesFrom(referenceDate)
    const weekStartStr = weekDates[0]
    const weekStart = startOfLocalDay(weekDates[0])
    const weekEnd = startOfNextLocalDay(weekDates[6])

    let rangeStart: Date
    let rangeEnd: Date
    let prevStart: Date
    let prevEnd: Date
    if (period === "day") {
      rangeStart = startOfLocalDay(referenceDate)
      rangeEnd = startOfNextLocalDay(referenceDate)
      prevStart = startOfLocalDay(addDaysStr(referenceDate, -1))
      prevEnd = rangeStart
    } else if (period === "week") {
      rangeStart = weekStart
      rangeEnd = weekEnd
      prevStart = startOfLocalDay(addDaysStr(weekStartStr, -7))
      prevEnd = weekStart
    } else {
      const nextMonthStr = refM === 12 ? `${refY + 1}-01` : `${refY}-${pad(refM + 1)}`
      const prevMonthStr = refM === 1 ? `${refY - 1}-12` : `${refY}-${pad(refM - 1)}`
      rangeStart = startOfLocalDay(`${refY}-${pad(refM)}-01`)
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
    ] = await Promise.all([
      db.patient.count({
        where: {
          deletedAt: null,
          createdAt: { gte: rangeStart, lt: rangeEnd },
          ...patientScope,
        },
      }),
      db.appointment.count({
        where: {
          deletedAt: null,
          status: { in: DONE },
          scheduledStart: { gte: rangeStart, lt: rangeEnd },
          ...apptScope,
        },
      }),
      db.appointment.count({
        where: {
          deletedAt: null,
          status: { in: DONE },
          scheduledStart: { gte: prevStart, lt: prevEnd },
          ...apptScope,
        },
      }),
      db.appointment.count({
        where: {
          deletedAt: null,
          status: { in: PENDING },
          scheduledStart: { gte: rangeStart, lt: rangeEnd },
          ...apptScope,
        },
      }),
      db.appointment.count({
        where: {
          deletedAt: null,
          status: AppointmentStatus.Cancelled,
          scheduledStart: { gte: rangeStart, lt: rangeEnd },
          ...apptScope,
        },
      }),
      db.medicalRecord.count({
        where: {
          deletedAt: null,
          createdAt: { gte: rangeStart, lt: rangeEnd },
          ...recordScope,
        },
      }),
      db.transaction.aggregate({
        _sum: { amount: true },
        where: {
          deletedAt: null,
          type: TransactionType.Income,
          status: TransactionStatus.Confirmed,
          competenceDate: { gte: rangeStart, lt: rangeEnd },
          ...txScope,
        },
      }),
      db.transaction.aggregate({
        _sum: { amount: true },
        where: {
          deletedAt: null,
          type: TransactionType.Income,
          status: TransactionStatus.Confirmed,
          competenceDate: { gte: prevStart, lt: prevEnd },
          ...txScope,
        },
      }),
      db.appointment.groupBy({
        by: ["status"],
        _count: true,
        where: {
          deletedAt: null,
          scheduledStart: { gte: rangeStart, lt: rangeEnd },
          ...apptScope,
        },
      }),
      db.appointment.findMany({
        where: {
          deletedAt: null,
          status: { not: AppointmentStatus.Cancelled },
          scheduledStart: { gte: rangeStart, lt: rangeEnd },
          ...apptScope,
        },
        select: { scheduledStart: true },
      }),
      db.appointment.findMany({
        where: {
          deletedAt: null,
          scheduledStart: { gte: rangeStart, lt: rangeEnd },
          ...apptScope,
        },
        orderBy: { scheduledStart: "asc" },
        select: {
          id: true,
          patientId: true,
          scheduledStart: true,
          scheduledEnd: true,
          status: true,
          patientNameSnapshot: true,
          professionalNameSnapshot: true,
          patient: { select: { id: true, name: true, birthDate: true, sex: true } },
          doctor: { select: { name: true } },
        },
      }),
      db.appointment.groupBy({
        by: ["patientId"],
        where: {
          deletedAt: null,
          scheduledStart: { gte: rangeStart, lt: rangeEnd },
          ...apptScope,
        },
      }),
      doctorFilter === undefined
        ? db.appointment.groupBy({
            by: ["doctorId"],
            _count: true,
            where: {
              deletedAt: null,
              status: { in: DONE },
              scheduledStart: { gte: rangeStart, lt: rangeEnd },
            },
            orderBy: { _count: { doctorId: "desc" } },
            take: 1,
          })
        : Promise.resolve([]),
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
    const fmt = (d: string) => d.split("-").reverse().join("/")
    const calendarLabel =
      period === "day"
        ? referenceDate === today
          ? `Hoje — ${fmt(referenceDate)}`
          : fmt(referenceDate)
        : period === "week"
          ? `Semana ${fmt(weekDates[0]).slice(0, 5)} – ${fmt(weekDates[6]).slice(0, 5)}`
          : `${MONTHS[refM - 1]} ${refY}`

    const inPeriod = (date: string) => {
      const d = startOfLocalDay(date).getTime()
      return d >= rangeStart.getTime() && d < rangeEnd.getTime()
    }

    const calendar =
      period === "month"
        ? buildMonthCalendar(refY, refM, today, countMap)
        : buildWeekCalendar(weekDates, today, referenceDate, countMap, inPeriod)

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

    if (doctorFilter !== undefined && doctorFilter > 0) {
      const doc = await db.doctor.findUnique({
        where: { id: doctorFilter },
        include: { specialty: true },
      })
      if (doc) {
        featuredDoctor = {
          name: doc.name,
          specialty: doc.specialty?.name ?? "Clínica",
          qualification: doc.crm ? `CRM ${doc.crm}` : doc.specialty?.name ?? null,
          shift: doc.shift,
          completedCount: completedRange,
        }
      }
    } else if (topDoctor.length > 0) {
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

    let focusPatient: {
      patientName: string
      demographics: string
      patientId: string
      appointmentDate: string
      appointmentTime: string
      statusLabel: string
      contextLabel: string
    } | null = null

    const now = new Date()
    const focusPick = pickFocusAppointment(agendaRows, now, referenceDate, today)

    if (focusPick) {
      const { row, context } = focusPick
      const patientName = row.patient?.name ?? row.patientNameSnapshot ?? "Paciente"
      focusPatient = {
        patientName,
        demographics: buildPatientDemographics(row.patient),
        patientId: `#${String(row.patient?.id ?? row.patientId).padStart(5, "0")}`,
        appointmentDate: toLocalDate(row.scheduledStart),
        appointmentTime: toLocalSlotTime(row.scheduledStart),
        statusLabel: STATUS_LABEL[row.status] ?? row.status,
        contextLabel: FOCUS_CONTEXT_LABEL[context],
      }

      const lastRecord = await db.medicalRecord.findFirst({
        where: {
          deletedAt: null,
          patientId: row.patientId,
          appointmentId: { not: row.id },
          ...recordScope,
        },
        orderBy: { createdAt: "desc" },
        include: {
          patient: true,
          appointment: {
            select: { scheduledStart: true, professionalNameSnapshot: true },
          },
          prescriptions: { include: { items: true } },
        },
      })

      if (lastRecord) {
        lastVisit = buildLastVisitFromRecord(lastRecord)
      }
    }

    return NextResponse.json({
      period,
      referenceDate,
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
      focusPatient,
      lastVisit,
      statusBreakdown,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
