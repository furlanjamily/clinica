import type { Notification, NotificationRecipient, User } from "@/generated/prisma/client"
import {
  NOTIFICATION_ACTION_LABEL,
  NOTIFICATION_TYPE,
  type NotificationType,
} from "./constants"
import type { NotificationDTO, NotificationMetadataDTO } from "./dto"

type RecipientWithNotification = NotificationRecipient & {
  notification: Notification & { createdBy: User }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function readString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value : undefined
}

function parseMetadata(raw: unknown): NotificationMetadataDTO | undefined {
  if (!isRecord(raw)) return undefined

  const metadata: NotificationMetadataDTO = {}
  const comment = readString(raw.comment)
  const previousStatus = readString(raw.previousStatus)
  const currentStatus = readString(raw.currentStatus)
  const entityName = readString(raw.entityName)
  const action = readString(raw.action)
  const isSystem = readString(raw.isSystem)
  const reminderKind = readString(raw.reminderKind)

  if (comment) metadata.comment = comment
  if (previousStatus) metadata.previousStatus = previousStatus
  if (currentStatus) metadata.currentStatus = currentStatus
  if (entityName) metadata.entityName = entityName
  if (action) metadata.action = action
  if (isSystem) metadata.isSystem = isSystem
  if (reminderKind) metadata.reminderKind = reminderKind

  return Object.keys(metadata).length > 0 ? metadata : undefined
}

function resolveAction(
  type: NotificationType,
  metadata?: NotificationMetadataDTO
): string {
  return metadata?.action ?? NOTIFICATION_ACTION_LABEL[type]
}

function resolveActorName(user: User): string {
  return user.name?.trim() || user.email.split("@")[0] || "Usuário"
}

function resolveConversationId(
  type: NotificationType,
  entityId: string | null
): number | undefined {
  if (type !== NOTIFICATION_TYPE.MESSAGE || !entityId) return undefined
  const id = Number(entityId)
  return Number.isInteger(id) && id > 0 ? id : undefined
}

function resolveActorPresentation(
  recipient: RecipientWithNotification,
  type: NotificationType,
  metadata: NotificationMetadataDTO | undefined
): { actorName: string; action: string } {
  const { notification } = recipient
  const isSelfAssignedAppointment =
    type === NOTIFICATION_TYPE.APPOINTMENT &&
    recipient.userId === notification.createdById

  if (isSelfAssignedAppointment) {
    return {
      actorName: "Você",
      action: "atribuiu um agendamento a você mesmo",
    }
  }

  const isSystemReminder =
    type === NOTIFICATION_TYPE.REMINDER && metadata?.isSystem === "true"

  if (isSystemReminder) {
    return {
      actorName: "Lembrete",
      action: resolveAction(type, metadata),
    }
  }

  return {
    actorName: resolveActorName(notification.createdBy),
    action: resolveAction(type, metadata),
  }
}

export function toNotificationDTO(recipient: RecipientWithNotification): NotificationDTO {
  const { notification } = recipient
  const metadata = parseMetadata(notification.metadata)
  const type = notification.type as NotificationType
  const { actorName, action } = resolveActorPresentation(recipient, type, metadata)

  return {
    id: notification.id,
    recipientId: recipient.id,
    type,
    actorName,
    actorAvatar: notification.createdBy.image,
    action,
    entityName: metadata?.entityName,
    conversationId: resolveConversationId(type, notification.entityId),
    description: notification.description ?? undefined,
    unread: recipient.readAt == null,
    archived: recipient.archivedAt != null,
    createdAt: notification.createdAt.toISOString(),
    metadata,
  }
}

export function encodeNotificationCursor(createdAt: Date, id: string): string {
  return `${createdAt.toISOString()}_${id}`
}

export function decodeNotificationCursor(
  cursor?: string
): { createdAt: Date; id: string } | undefined {
  if (!cursor) return undefined

  const separatorIndex = cursor.indexOf("_")
  if (separatorIndex <= 0) return undefined

  const iso = cursor.slice(0, separatorIndex)
  const id = cursor.slice(separatorIndex + 1)
  const createdAt = new Date(iso)

  if (!id || Number.isNaN(createdAt.getTime())) return undefined
  return { createdAt, id }
}
