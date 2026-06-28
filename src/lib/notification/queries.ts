import type { Prisma } from "@/generated/prisma/client"
import { NOTIFICATION_TAB, type NotificationTab } from "./constants"
import { decodeNotificationCursor } from "./mapper"

export const NOTIFICATION_INCLUDE = {
  notification: {
    include: {
      createdBy: true,
    },
  },
} as const satisfies Prisma.NotificationRecipientInclude

export function buildRecipientTabWhere(
  userId: string,
  tab: NotificationTab
): Prisma.NotificationRecipientWhereInput {
  const base: Prisma.NotificationRecipientWhereInput = {
    userId,
    notification: { deletedAt: null },
  }

  switch (tab) {
    case NOTIFICATION_TAB.UNREAD:
      return { ...base, readAt: null, archivedAt: null }
    case NOTIFICATION_TAB.READ:
      return { ...base, readAt: { not: null }, archivedAt: null }
    case NOTIFICATION_TAB.ARCHIVED:
      return { ...base, archivedAt: { not: null } }
  }
}

export function buildRecipientCursorWhere(
  cursor?: string
): Prisma.NotificationRecipientWhereInput | undefined {
  const decoded = decodeNotificationCursor(cursor)
  if (!decoded) return undefined

  return {
    OR: [
      {
        notification: {
          createdAt: { lt: decoded.createdAt },
        },
      },
      {
        notification: {
          createdAt: decoded.createdAt,
          id: { lt: decoded.id },
        },
      },
    ],
  }
}

export function buildUnreadCountWhere(userId: string): Prisma.NotificationRecipientWhereInput {
  return {
    userId,
    readAt: null,
    archivedAt: null,
    notification: { deletedAt: null },
  }
}
