import { Server as SocketIOServer } from "socket.io"
import { getToken } from "next-auth/jwt"
import {
  setSocketServer,
  conversationRoom,
  userRoom,
  SOCKET_EVENTS,
  type InitializeSocketOptions,
} from "./socket-events"
import { onlineStore } from "./online-store"
import { emitOnlineUsers } from "./socket-emitter"
import logger from "@/lib/logging/logger"

type SocketData = {
  userId: string
}

async function authenticateSocket(cookie: string | undefined): Promise<string | null> {
  if (!cookie) return null
  const token = await getToken({
    req: { headers: { cookie } } as Parameters<typeof getToken>[0]["req"],
    secret: process.env.NEXTAUTH_SECRET,
    secureCookie: process.env.NEXTAUTH_URL?.startsWith("https://") ?? false,
  })
  return token?.sub ?? null
}

export function initializeSocketServer({ httpServer }: InitializeSocketOptions): SocketIOServer {
  const io = new SocketIOServer<Record<string, unknown>, Record<string, unknown>, Record<string, unknown>, SocketData>(
    httpServer,
    {
      path: "/api/socketio",
      cors: {
        origin: [
          process.env.NEXTAUTH_URL,
          process.env.NEXT_PUBLIC_APP_URL,
        ].filter(Boolean) as string[],
        credentials: true,
      },
      transports: ["websocket", "polling"],
    }
  )

  // Ponto de extensão para Redis Adapter:
  // import { createAdapter } from "@socket.io/redis-adapter"
  // io.adapter(createAdapter(pubClient, subClient))

  setSocketServer(io)

  io.use(async (socket, next) => {
    const cookie = socket.handshake.headers.cookie
    const userId = await authenticateSocket(cookie)
    if (!userId) {
      next(new Error("Unauthorized"))
      return
    }
    socket.data.userId = userId
    next()
  })

  io.on("connection", (socket) => {
    const userId = socket.data.userId
    onlineStore.addConnection(userId, socket.id)
    void socket.join(userRoom(userId))
    emitOnlineUsers(onlineStore.getOnlineUserIds())

    socket.on(SOCKET_EVENTS.joinConversation, (payload: { conversationId: number }) => {
      if (payload?.conversationId) {
        void socket.join(conversationRoom(payload.conversationId))
      }
    })

    socket.on(SOCKET_EVENTS.leaveConversation, (payload: { conversationId: number }) => {
      if (payload?.conversationId) {
        void socket.leave(conversationRoom(payload.conversationId))
      }
    })

    socket.on("disconnect", () => {
      onlineStore.removeConnection(userId, socket.id)
      emitOnlineUsers(onlineStore.getOnlineUserIds())
    })
  })

  logger.info("Socket.IO server initialized")
  return io
}
