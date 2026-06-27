import type { Server as HttpServer } from "node:http"
import type { Server as SocketIOServer } from "socket.io"

/** Estado global do Socket.IO — pronto para Redis Adapter sem refatoração estrutural. */
declare global {
  var __clinysoftSocketIO: SocketIOServer | undefined
}

export function setSocketServer(io: SocketIOServer): void {
  globalThis.__clinysoftSocketIO = io
}

export function getSocketServer(): SocketIOServer | null {
  return globalThis.__clinysoftSocketIO ?? null
}

export function conversationRoom(conversationId: number): string {
  return `conversation:${conversationId}`
}

export function userRoom(userId: string): string {
  return `user:${userId}`
}

export type SocketEventMap = {
  connect: void
  disconnect: void
  joinConversation: { conversationId: number }
  leaveConversation: { conversationId: number }
  newMessage: { message: unknown }
  messageEdited: { message: unknown }
  messageDeleted: { messageId: number; conversationId: number }
  typingStart: { conversationId: number; user: { userId: string; name: string | null } }
  typingStop: { conversationId: number; userId: string }
  messageRead: { conversationId: number; messageIds: number[]; userId: string }
  conversationUpdated: { conversation: unknown }
  onlineUsers: { userIds: string[] }
}

export const SOCKET_EVENTS = {
  connect: "connect",
  disconnect: "disconnect",
  joinConversation: "joinConversation",
  leaveConversation: "leaveConversation",
  newMessage: "newMessage",
  messageEdited: "messageEdited",
  messageDeleted: "messageDeleted",
  typingStart: "typingStart",
  typingStop: "typingStop",
  messageRead: "messageRead",
  conversationUpdated: "conversationUpdated",
  onlineUsers: "onlineUsers",
  deliverMessage: "deliverMessage",
} as const

export type InitializeSocketOptions = {
  httpServer: HttpServer
}
