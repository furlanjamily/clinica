import { getSocketServer, conversationRoom, userRoom, SOCKET_EVENTS } from "./socket-events"

export function emitNewMessage(conversationId: number, message: unknown): void {
  const io = getSocketServer()
  if (!io) return
  io.to(conversationRoom(conversationId)).emit(SOCKET_EVENTS.newMessage, { message })
}

export function emitMessageEdited(conversationId: number, message: unknown): void {
  const io = getSocketServer()
  if (!io) return
  io.to(conversationRoom(conversationId)).emit(SOCKET_EVENTS.messageEdited, { message })
}

export function emitMessageDeleted(conversationId: number, messageId: number): void {
  const io = getSocketServer()
  if (!io) return
  io.to(conversationRoom(conversationId)).emit(SOCKET_EVENTS.messageDeleted, {
    messageId,
    conversationId,
  })
}

export function emitTypingStart(
  conversationId: number,
  user: { userId: string; name: string | null }
): void {
  const io = getSocketServer()
  if (!io) return
  io.to(conversationRoom(conversationId)).emit(SOCKET_EVENTS.typingStart, {
    conversationId,
    user,
  })
}

export function emitTypingStop(conversationId: number, userId: string): void {
  const io = getSocketServer()
  if (!io) return
  io.to(conversationRoom(conversationId)).emit(SOCKET_EVENTS.typingStop, {
    conversationId,
    userId,
  })
}

export function emitMessageRead(
  conversationId: number,
  messageIds: number[],
  userId: string
): void {
  const io = getSocketServer()
  if (!io) return
  io.to(conversationRoom(conversationId)).emit(SOCKET_EVENTS.messageRead, {
    conversationId,
    messageIds,
    userId,
  })
}

export function emitConversationUpdated(userId: string, conversation: unknown): void {
  const io = getSocketServer()
  if (!io) return
  io.to(userRoom(userId)).emit(SOCKET_EVENTS.conversationUpdated, { conversation })
}

export function emitOnlineUsers(userIds: string[]): void {
  const io = getSocketServer()
  if (!io) return
  io.emit(SOCKET_EVENTS.onlineUsers, { userIds })
}

export function emitToConversation(
  conversationId: number,
  event: string,
  payload: unknown
): void {
  const io = getSocketServer()
  if (!io) return
  io.to(conversationRoom(conversationId)).emit(event, payload)
}
