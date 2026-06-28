import { db } from "@/lib/db"
import { toLocalDate, toLocalSlotTime } from "@/lib/datetime/appointment-time"
import { AppointmentStatus } from "@/lib/schedule/status"
import {
  NOTIFICATION_ENTITY_TYPE,
  NOTIFICATION_TYPE,
} from "./constants"
import {
  formatAppointmentReminderAction,
  formatTaskReminderAction,
  getReminderTriggerWindow,
  minutesUntil,
  REMINDER_DEDUPE_WINDOW_MS,
} from "./reminder-config"
import { createNotification } from "./service"
import { resolveUserIdsByDoctorId } from "./triggers"

const REMINDABLE_APPOINTMENT_STATUSES = [
  AppointmentStatus.Scheduled,
  AppointmentStatus.AwaitingConfirmation,
  AppointmentStatus.Confirmed,
  AppointmentStatus.CheckIn,
] as const

function formatDueLabel(instant: Date): string {
  const date = toLocalDate(instant)
  const time = toLocalSlotTime(instant)
  return `${date.split("-").reverse().join("/")} às ${time}`
}

function reminderEntityId(kind: "appointment" | "task", id: number): string {
  return `${kind}:${id}`
}

async function hasRecentReminder(
  recipientId: string,
  entityId: string
): Promise<boolean> {
  const since = new Date(Date.now() - REMINDER_DEDUPE_WINDOW_MS)
  const existing = await db.notificationRecipient.findFirst({
    where: {
      userId: recipientId,
      notification: {
        type: NOTIFICATION_TYPE.REMINDER,
        entityId,
        deletedAt: null,
        createdAt: { gte: since },
      },
    },
    select: { id: true },
  })
  return existing != null
}

async function notifySystemReminder(input: {
  recipientId: string
  entityId: string
  entityType: (typeof NOTIFICATION_ENTITY_TYPE)[keyof typeof NOTIFICATION_ENTITY_TYPE]
  entityName: string
  description: string
  action: string
  reminderKind: "appointment" | "task"
}): Promise<boolean> {
  if (await hasRecentReminder(input.recipientId, input.entityId)) {
    return false
  }

  await createNotification({
    type: NOTIFICATION_TYPE.REMINDER,
    createdById: input.recipientId,
    recipientIds: [input.recipientId],
    excludeCreator: false,
    entityId: input.entityId,
    entityType: input.entityType,
    description: input.description,
    metadata: {
      entityName: input.entityName,
      action: input.action,
      isSystem: "true",
      reminderKind: input.reminderKind,
    },
  })

  return true
}

async function processAppointmentReminders(userId?: string): Promise<number> {
  const now = new Date()
  const { windowEnd } = getReminderTriggerWindow(now)
  let created = 0

  const appointments = await db.appointment.findMany({
    where: {
      deletedAt: null,
      scheduledStart: { gt: now, lte: windowEnd },
      status: { in: [...REMINDABLE_APPOINTMENT_STATUSES] },
      ...(userId
        ? {
            doctor: {
              users: { some: { id: userId, active: true } },
            },
          }
        : {}),
    },
    select: {
      id: true,
      scheduledStart: true,
      patientNameSnapshot: true,
      patient: { select: { name: true } },
      doctorId: true,
    },
  })

  for (const appointment of appointments) {
    const recipientIds = userId
      ? [userId]
      : await resolveUserIdsByDoctorId(appointment.doctorId)

    const patientName =
      appointment.patient?.name ?? appointment.patientNameSnapshot ?? "Paciente"
    const entityId = reminderEntityId("appointment", appointment.id)
    const description = formatDueLabel(appointment.scheduledStart)

    for (const recipientId of recipientIds) {
      const sent = await notifySystemReminder({
        recipientId,
        entityId,
        entityType: NOTIFICATION_ENTITY_TYPE.APPOINTMENT,
        entityName: patientName,
        description,
        action: formatAppointmentReminderAction(
          minutesUntil(now, appointment.scheduledStart)
        ),
        reminderKind: "appointment",
      })
      if (sent) created += 1
    }
  }

  return created
}

async function processTaskReminders(userId?: string): Promise<number> {
  const now = new Date()
  const { windowEnd } = getReminderTriggerWindow(now)
  let created = 0

  const tasks = await db.userTask.findMany({
    where: {
      deletedAt: null,
      status: { not: "completed" },
      dueAt: { gt: now, lte: windowEnd },
      ...(userId ? { userId } : {}),
    },
    select: {
      id: true,
      title: true,
      dueAt: true,
      userId: true,
    },
  })

  for (const task of tasks) {
    const entityId = reminderEntityId("task", task.id)
    const sent = await notifySystemReminder({
      recipientId: task.userId,
      entityId,
      entityType: NOTIFICATION_ENTITY_TYPE.TASK,
      entityName: task.title,
      description: formatDueLabel(task.dueAt),
      action: formatTaskReminderAction(minutesUntil(now, task.dueAt)),
      reminderKind: "task",
    })
    if (sent) created += 1
  }

  return created
}

export async function processDueReminders(userId?: string): Promise<{
  appointments: number
  tasks: number
}> {
  const [appointments, tasks] = await Promise.all([
    processAppointmentReminders(userId),
    processTaskReminders(userId),
  ])
  return { appointments, tasks }
}
