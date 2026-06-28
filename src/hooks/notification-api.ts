"use client"

import { absoluteUrl } from "@/lib/absolute-url"
import type { NotificationTab } from "@/lib/notification/constants"
import type {
  ArchiveResultDTO,
  MarkReadResultDTO,
  NotificationPageDTO,
  UnreadCountDTO,
} from "@/lib/notification/dto"

export async function readErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const body = await res.json()
    return body?.message ?? fallback
  } catch {
    return fallback
  }
}

export async function fetchNotifications(
  tab: NotificationTab,
  cursor?: string,
  limit?: number
): Promise<NotificationPageDTO> {
  const params = new URLSearchParams({ tab })
  if (cursor) params.set("cursor", cursor)
  if (limit) params.set("limit", String(limit))

  const res = await fetch(absoluteUrl(`/api/notification?${params}`))
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, "Erro ao buscar notificações"))
  }
  return res.json()
}

export async function fetchUnreadCount(): Promise<UnreadCountDTO> {
  const res = await fetch(absoluteUrl("/api/notification/unread-count"))
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, "Erro ao buscar contador"))
  }
  return res.json()
}

export async function markNotificationsReadApi(
  notificationIds: string[]
): Promise<MarkReadResultDTO> {
  const res = await fetch(absoluteUrl("/api/notification/read"), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ notificationIds }),
  })
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, "Erro ao marcar como lida"))
  }
  return res.json()
}

export async function markAllNotificationsReadApi(): Promise<MarkReadResultDTO> {
  const res = await fetch(absoluteUrl("/api/notification/read-all"), {
    method: "PATCH",
  })
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, "Erro ao marcar todas como lidas"))
  }
  return res.json()
}

export async function archiveNotificationsApi(
  notificationIds: string[]
): Promise<ArchiveResultDTO> {
  const res = await fetch(absoluteUrl("/api/notification/archive"), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ notificationIds }),
  })
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, "Erro ao arquivar notificação"))
  }
  return res.json()
}
