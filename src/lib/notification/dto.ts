import type { NotificationTab, NotificationType } from "./constants"

export interface NotificationMetadataDTO {
  comment?: string
  previousStatus?: string
  currentStatus?: string
  entityName?: string
  action?: string
  isSystem?: string
  reminderKind?: string
}

export interface NotificationDTO {
  id: string
  recipientId: string
  type: NotificationType
  actorName: string
  actorAvatar: string | null
  action: string
  entityName?: string
  /** Conversa vinculada (notificações de mensagem). */
  conversationId?: number
  description?: string
  unread: boolean
  archived: boolean
  createdAt: string
  metadata?: NotificationMetadataDTO
}

export interface NotificationDayGroupDTO {
  dayLabel: string
  notifications: NotificationDTO[]
}

export interface NotificationPageDTO {
  notifications: NotificationDTO[]
  nextCursor: string | null
  hasMore: boolean
}

export interface UnreadCountDTO {
  count: number
}

export interface MarkReadResultDTO {
  updatedCount: number
}

export interface ArchiveResultDTO {
  updatedCount: number
}

export type NotificationListParams = {
  tab: NotificationTab
  cursor?: string
  limit?: number
}
