import { db } from "@/lib/db"
import { NotFoundError } from "@/lib/errors/custom-errors"
import {
  NOTIFICATION_DEFAULT_LIMIT,
  NOTIFICATION_MAX_LIMIT,
  type NotificationEntityType,
  type NotificationTab,
  type NotificationType,
} from "./constants"
import type {
  ArchiveResultDTO,
  MarkReadResultDTO,
  NotificationPageDTO,
  UnreadCountDTO,
} from "./dto"
import {
  encodeNotificationCursor,
  toNotificationDTO,
} from "./mapper"
import { emitNotificationCreated } from "./socket-emitter"
import {
  buildRecipientCursorWhere,
  buildRecipientTabWhere,
  buildUnreadCountWhere,
  NOTIFICATION_INCLUDE,
} from "./queries"

function resolveLimit(limit?: number): number {
  if (!limit) return NOTIFICATION_DEFAULT_LIMIT
  return Math.min(Math.max(limit, 1), NOTIFICATION_MAX_LIMIT)
}

export async function listNotifications(
  userId: string,
  tab: NotificationTab,
  cursor?: string,
  limit?: number
): Promise<NotificationPageDTO> {
  const take = resolveLimit(limit)
  const cursorWhere = buildRecipientCursorWhere(cursor)

  const recipients = await db.notificationRecipient.findMany({
    where: {
      ...buildRecipientTabWhere(userId, tab),
      ...(cursorWhere ?? {}),
    },
    include: NOTIFICATION_INCLUDE,
    orderBy: [{ notification: { createdAt: "desc" } }, { notification: { id: "desc" } }],
    take: take + 1,
  })

  const hasMore = recipients.length > take
  const page = hasMore ? recipients.slice(0, take) : recipients
  const notifications = page.map(toNotificationDTO)

  const last = page.at(-1)
  const nextCursor =
    hasMore && last
      ? encodeNotificationCursor(last.notification.createdAt, last.notification.id)
      : null

  return { notifications, nextCursor, hasMore }
}

export async function getUnreadCount(userId: string): Promise<UnreadCountDTO> {
  const count = await db.notificationRecipient.count({
    where: buildUnreadCountWhere(userId),
  })
  return { count }
}

export async function markNotificationsAsRead(
  userId: string,
  notificationIds: string[]
): Promise<MarkReadResultDTO> {
  const now = new Date()

  const result = await db.notificationRecipient.updateMany({
    where: {
      userId,
      readAt: null,
      archivedAt: null,
      notificationId: { in: notificationIds },
      notification: { deletedAt: null },
    },
    data: { readAt: now },
  })

  return { updatedCount: result.count }
}

export async function markAllNotificationsAsRead(
  userId: string
): Promise<MarkReadResultDTO> {
  const now = new Date()

  const result = await db.notificationRecipient.updateMany({
    where: buildUnreadCountWhere(userId),
    data: { readAt: now },
  })

  return { updatedCount: result.count }
}

export async function archiveNotifications(
  userId: string,
  notificationIds: string[]
): Promise<ArchiveResultDTO> {
  const now = new Date()

  const recipients = await db.notificationRecipient.findMany({
    where: {
      userId,
      notificationId: { in: notificationIds },
      notification: { deletedAt: null },
    },
    select: { id: true, readAt: true },
  })

  if (recipients.length === 0) {
    throw new NotFoundError("Notificação não encontrada.")
  }

  const unreadIds = recipients.filter((r) => r.readAt == null).map((r) => r.id)
  if (unreadIds.length > 0) {
    await db.notificationRecipient.updateMany({
      where: { id: { in: unreadIds } },
      data: { readAt: now },
    })
  }

  const result = await db.notificationRecipient.updateMany({
    where: {
      userId,
      notificationId: { in: notificationIds },
      notification: { deletedAt: null },
    },
    data: { archivedAt: now },
  })

  return { updatedCount: result.count }
}

export async function createNotification(input: {
  type: NotificationType
  createdById: string
  recipientIds: string[]
  title?: string
  description?: string
  entityId?: string
  entityType?: NotificationEntityType
  metadata?: Record<string, string>
  /** Quando false, o criador também recebe (ex.: agendamento atribuído ao próprio médico). */
  excludeCreator?: boolean
}): Promise<void> {
  const shouldExcludeCreator = input.excludeCreator !== false
  const uniqueRecipients = [
    ...new Set(
      shouldExcludeCreator
        ? input.recipientIds.filter((id) => id !== input.createdById)
        : input.recipientIds
    ),
  ]
  if (uniqueRecipients.length === 0) return

  await db.notification.create({
    data: {
      type: input.type,
      title: input.title,
      description: input.description,
      entityId: input.entityId,
      entityType: input.entityType,
      metadata: input.metadata,
      createdById: input.createdById,
      recipients: {
        create: uniqueRecipients.map((userId) => ({ userId })),
      },
    },
  })

  emitNotificationCreated(uniqueRecipients)
}
