import { getSocketServer, userRoom } from "@/lib/chat/socket-events"
import { NOTIFICATION_SOCKET_EVENT } from "./constants"

export function emitNotificationCreated(recipientUserIds: string[]): void {
  const io = getSocketServer()
  if (!io || recipientUserIds.length === 0) return

  for (const userId of recipientUserIds) {
    io.to(userRoom(userId)).emit(NOTIFICATION_SOCKET_EVENT.CREATED, { userId })
  }
}
