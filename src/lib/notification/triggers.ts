import { db } from "@/lib/db"
import { toLocalDate, toLocalSlotTime } from "@/lib/datetime/appointment-time"
import {
  NOTIFICATION_ENTITY_TYPE,
  NOTIFICATION_TYPE,
} from "./constants"
import { createNotification } from "./service"

const PREVIEW_MAX_LENGTH = 140

export function buildMessagePreview(
  content: string | null | undefined,
  attachmentCount = 0
): string {
  const trimmed = content?.trim()
  if (trimmed) {
    return trimmed.length > PREVIEW_MAX_LENGTH
      ? `${trimmed.slice(0, PREVIEW_MAX_LENGTH)}…`
      : trimmed
  }
  if (attachmentCount > 0) {
    return attachmentCount === 1 ? "Enviou um anexo" : `Enviou ${attachmentCount} anexos`
  }
  return "Nova mensagem"
}

export async function resolveUserIdsByDoctorId(doctorId: number): Promise<string[]> {
  const users = await db.user.findMany({
    where: { doctorId, active: true },
    select: { id: true },
  })
  return users.map((user) => user.id)
}

export async function notifyNewChatMessage(input: {
  senderId: string
  recipientIds: string[]
  conversationId: number
  conversationTitle?: string | null
  preview: string
}): Promise<void> {
  try {
    const recipients = input.recipientIds.filter((id) => id !== input.senderId)
    if (recipients.length === 0) return

    await createNotification({
      type: NOTIFICATION_TYPE.MESSAGE,
      createdById: input.senderId,
      recipientIds: recipients,
      entityId: String(input.conversationId),
      entityType: NOTIFICATION_ENTITY_TYPE.SYSTEM,
      description: input.preview,
      metadata: {
        entityName: input.conversationTitle?.trim() || "Conversa",
        action: "enviou uma mensagem",
      },
    })
  } catch {
    // Notificação é efeito colateral — não bloqueia o envio da mensagem.
  }
}

export async function notifyAppointmentAssigned(input: {
  createdById: string
  doctorId: number
  appointmentId: number
  patientName: string
  scheduledStart: Date
}): Promise<void> {
  try {
    const recipientIds = await resolveUserIdsByDoctorId(input.doctorId)
    if (recipientIds.length === 0) return

    const date = toLocalDate(input.scheduledStart)
    const time = toLocalSlotTime(input.scheduledStart)
    const formatted = `${date.split("-").reverse().join("/")} às ${time}`

    await createNotification({
      type: NOTIFICATION_TYPE.APPOINTMENT,
      createdById: input.createdById,
      recipientIds,
      excludeCreator: false,
      entityId: String(input.appointmentId),
      entityType: NOTIFICATION_ENTITY_TYPE.APPOINTMENT,
      description: formatted,
      metadata: {
        entityName: input.patientName,
        action: "atribuiu um agendamento a você",
      },
    })
  } catch {
    // Notificação é efeito colateral — não bloqueia o agendamento.
  }
}
