import { z } from "zod"
import { NOTIFICATION_TAB } from "@/lib/notification/constants"

export const ListNotificationsSchema = z.object({
  tab: z.enum([
    NOTIFICATION_TAB.UNREAD,
    NOTIFICATION_TAB.READ,
    NOTIFICATION_TAB.ARCHIVED,
  ]),
  cursor: z.string().trim().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
})

export const MarkNotificationsReadSchema = z.object({
  notificationIds: z.array(z.string().min(1)).min(1),
})

export const ArchiveNotificationsSchema = z.object({
  notificationIds: z.array(z.string().min(1)).min(1),
})
