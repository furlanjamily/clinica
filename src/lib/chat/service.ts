import { db } from "@/lib/db"
import { NotFoundError, ForbiddenError, ValidationError } from "@/lib/errors/custom-errors"
import type { Prisma } from "@/generated/prisma/client"
import { toConversationDTO } from "./conversation-dto"
import { toMessageDTO } from "./message-dto"
import { resolveJobTitle } from "./format"
import { onlineStore } from "./online-store"
import {
  emitConversationUpdated,
  emitMessageDeleted,
  emitMessageEdited,
  emitMessageRead,
  emitNewMessage,
  emitTypingStart,
  emitTypingStop,
} from "./socket-emitter"
import type {
  ConversationDTO,
  ConversationSearchResult,
  MessagesPageDTO,
  TypingUser,
} from "./types"
import { ChatMessageStatus } from "./types"
import {
  buildMessagePreview,
  notifyNewChatMessage,
} from "@/lib/notification/triggers"

const MESSAGE_INCLUDE = {
  sender: true,
  attachments: true,
  reads: true,
  reactions: true,
  replyTo: { include: { sender: true } },
} as const

const CONVERSATION_INCLUDE = {
  participants: { include: { user: true } },
  messages: {
    orderBy: { createdAt: "desc" as const },
    take: 1,
    select: {
      id: true,
      content: true,
      senderId: true,
      createdAt: true,
      isDeleted: true,
    },
  },
} as const

function onlineSet(): Set<string> {
  return new Set(onlineStore.getOnlineUserIds())
}

async function assertParticipant(conversationId: number, userId: string) {
  const participant = await db.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
  })
  if (!participant) throw new ForbiddenError("Você não participa desta conversa.")
  return participant
}

async function refreshConversationForParticipants(conversationId: number) {
  const conv = await db.conversation.findUnique({
    where: { id: conversationId },
    include: CONVERSATION_INCLUDE,
  })
  if (!conv) return
  const online = onlineSet()
  for (const p of conv.participants) {
    const dto = toConversationDTO(conv, p.userId, online)
    emitConversationUpdated(p.userId, dto)
  }
}

export async function listConversations(
  userId: string,
  search?: string,
  archived = false
): Promise<ConversationSearchResult> {
  const where: Prisma.ConversationParticipantWhereInput = {
    userId,
    isArchived: archived,
    conversation: search
      ? {
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            {
              participants: {
                some: {
                  user: { name: { contains: search, mode: "insensitive" } },
                },
              },
            },
            {
              messages: {
                some: {
                  content: { contains: search, mode: "insensitive" },
                  isDeleted: false,
                },
              },
            },
          ],
        }
      : undefined,
  }

  const participants = await db.conversationParticipant.findMany({
    where,
    include: {
      conversation: { include: CONVERSATION_INCLUDE },
    },
    orderBy: { conversation: { lastMessageAt: "desc" } },
  })

  const online = onlineSet()
  const conversations = participants.map((p) =>
    toConversationDTO(p.conversation, userId, online)
  )

  const categories = [
    ...new Set(
      conversations.map((c) => c.category).filter((c): c is string => Boolean(c))
    ),
  ]

  return { conversations, categories }
}

export async function getTotalUnreadCount(
  userId: string
): Promise<{ count: number }> {
  const result = await db.conversationParticipant.aggregate({
    where: { userId, isArchived: false },
    _sum: { unreadCount: true },
  })
  return { count: result._sum.unreadCount ?? 0 }
}

export async function getConversation(
  userId: string,
  conversationId: number
): Promise<ConversationDTO> {
  await assertParticipant(conversationId, userId)
  const conv = await db.conversation.findUnique({
    where: { id: conversationId },
    include: CONVERSATION_INCLUDE,
  })
  if (!conv) throw new NotFoundError("Conversa não encontrada.")
  return toConversationDTO(conv, userId, onlineSet())
}

export async function createConversation(
  userId: string,
  participantIds: string[],
  title?: string,
  type: "Direct" | "Group" = "Direct"
): Promise<ConversationDTO> {
  if (userId === "portfolio-demo") {
    throw new ForbiddenError(
      "Modo demo sem usuário no banco. Execute o seed ou faça login com um usuário real."
    )
  }

  const uniqueIds = [...new Set([userId, ...participantIds])]

  if (type === "Direct" && uniqueIds.length === 2) {
    const candidates = await db.conversation.findMany({
      where: {
        type: "Direct",
        participants: { every: { userId: { in: uniqueIds } } },
      },
      include: {
        ...CONVERSATION_INCLUDE,
        _count: { select: { participants: true } },
      },
    })
    const existing = candidates.find((c) => c._count.participants === uniqueIds.length)
    if (existing) return toConversationDTO(existing, userId, onlineSet())
  }

  const conv = await db.conversation.create({
    data: {
      title: title ?? null,
      type,
      participants: {
        create: uniqueIds.map((id) => ({ userId: id })),
      },
    },
    include: CONVERSATION_INCLUDE,
  })

  return toConversationDTO(conv, userId, onlineSet())
}

export async function updateConversationParticipant(
  userId: string,
  conversationId: number,
  data: {
    isFavorite?: boolean
    isMuted?: boolean
    isArchived?: boolean
    category?: string | null
  }
): Promise<ConversationDTO> {
  await assertParticipant(conversationId, userId)
  await db.conversationParticipant.update({
    where: { conversationId_userId: { conversationId, userId } },
    data,
  })
  return getConversation(userId, conversationId)
}

export async function getMessages(
  userId: string,
  conversationId: number,
  cursor?: number,
  limit = 30,
  search?: string
): Promise<MessagesPageDTO> {
  await assertParticipant(conversationId, userId)

  const where: Prisma.MessageWhereInput = {
    conversationId,
    ...(search
      ? { content: { contains: search, mode: "insensitive" }, isDeleted: false }
      : {}),
    ...(cursor ? { id: { lt: cursor } } : {}),
  }

  const rows = await db.message.findMany({
    where,
    include: MESSAGE_INCLUDE,
    orderBy: { id: "desc" },
    take: limit + 1,
  })

  const hasMore = rows.length > limit
  const slice = hasMore ? rows.slice(0, limit) : rows
  const online = onlineSet()

  return {
    messages: slice.reverse().map((m) => toMessageDTO(m, online)),
    nextCursor: hasMore ? slice[0]?.id ?? null : null,
    hasMore,
  }
}

export async function sendMessage(
  userId: string,
  conversationId: number,
  content?: string,
  replyToId?: number,
  attachments?: Array<{
    fileName: string
    fileUrl: string
    mimeType?: string
    sizeBytes?: number
    type: "Image" | "Video" | "Pdf" | "Document" | "Link"
    thumbnailUrl?: string | null
  }>
) {
  await assertParticipant(conversationId, userId)

  if (!content?.trim() && (!attachments || attachments.length === 0)) {
    throw new ValidationError("Informe uma mensagem ou anexo.")
  }

  if (replyToId) {
    const reply = await db.message.findFirst({
      where: { id: replyToId, conversationId },
    })
    if (!reply) throw new NotFoundError("Mensagem de resposta não encontrada.")
  }

  const now = new Date()

  const message = await db.$transaction(async (tx) => {
    const created = await tx.message.create({
      data: {
        conversationId,
        senderId: userId,
        content: content?.trim() || null,
        replyToId: replyToId ?? null,
        status: ChatMessageStatus.Sent,
        attachments: attachments?.length
          ? {
              create: attachments.map((a) => ({
                fileName: a.fileName,
                fileUrl: a.fileUrl,
                mimeType: a.mimeType ?? null,
                sizeBytes: a.sizeBytes ?? null,
                type: a.type,
                thumbnailUrl: a.thumbnailUrl ?? null,
              })),
            }
          : undefined,
      },
      include: MESSAGE_INCLUDE,
    })

    await tx.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: now },
    })

    const others = await tx.conversationParticipant.findMany({
      where: { conversationId, userId: { not: userId } },
    })

    for (const p of others) {
      await tx.conversationParticipant.update({
        where: { id: p.id },
        data: { unreadCount: { increment: 1 } },
      })
    }

    return created
  })

  const dto = toMessageDTO(message, onlineSet())
  emitNewMessage(conversationId, dto)
  await refreshConversationForParticipants(conversationId)

  const recipients = await db.conversationParticipant.findMany({
    where: { conversationId, userId: { not: userId } },
    select: { userId: true },
  })

  const conversation = await db.conversation.findUnique({
    where: { id: conversationId },
    select: { title: true },
  })

  await notifyNewChatMessage({
    senderId: userId,
    recipientIds: recipients.map((participant) => participant.userId),
    conversationId,
    conversationTitle: conversation?.title,
    preview: buildMessagePreview(
      message.content,
      message.attachments.length
    ),
  })

  return dto
}

export async function editMessage(userId: string, messageId: number, content: string) {
  const msg = await db.message.findUnique({ where: { id: messageId } })
  if (!msg) throw new NotFoundError("Mensagem não encontrada.")
  if (msg.senderId !== userId) throw new ForbiddenError("Somente o autor pode editar.")
  if (msg.isDeleted) throw new ValidationError("Mensagem excluída.")

  const updated = await db.message.update({
    where: { id: messageId },
    data: { content, isEdited: true },
    include: MESSAGE_INCLUDE,
  })

  const dto = toMessageDTO(updated, onlineSet())
  emitMessageEdited(msg.conversationId, dto)
  return dto
}

export async function deleteMessage(userId: string, messageId: number) {
  const msg = await db.message.findUnique({ where: { id: messageId } })
  if (!msg) throw new NotFoundError("Mensagem não encontrada.")
  if (msg.senderId !== userId) throw new ForbiddenError("Somente o autor pode excluir.")

  await db.message.update({
    where: { id: messageId },
    data: { isDeleted: true, content: null },
  })

  emitMessageDeleted(msg.conversationId, messageId)
  await refreshConversationForParticipants(msg.conversationId)
  return { success: true }
}

export async function markMessagesAsRead(
  userId: string,
  conversationId: number,
  messageIds?: number[]
) {
  await assertParticipant(conversationId, userId)

  const unread = await db.message.findMany({
    where: {
      conversationId,
      senderId: { not: userId },
      reads: { none: { userId } },
      ...(messageIds?.length ? { id: { in: messageIds } } : {}),
    },
    select: { id: true },
  })

  if (unread.length === 0) {
    return { readIds: [] as number[] }
  }

  const ids = unread.map((m) => m.id)

  await db.$transaction(async (tx) => {
    await tx.messageRead.createMany({
      data: ids.map((messageId) => ({ messageId, userId })),
      skipDuplicates: true,
    })

    await tx.conversationParticipant.update({
      where: { conversationId_userId: { conversationId, userId } },
      data: { unreadCount: 0, lastReadAt: new Date() },
    })

    await tx.message.updateMany({
      where: { id: { in: ids } },
      data: { status: ChatMessageStatus.Read },
    })
  })

  emitMessageRead(conversationId, ids, userId)
  await refreshConversationForParticipants(conversationId)

  return { readIds: ids }
}

export async function markMessageDelivered(messageId: number, userId: string) {
  const msg = await db.message.findUnique({
    where: { id: messageId },
    include: { reads: true },
  })
  if (!msg || msg.senderId === userId) return

  if (msg.status === ChatMessageStatus.Sent) {
    await db.message.update({
      where: { id: messageId },
      data: { status: ChatMessageStatus.Delivered },
    })
  }
}

export async function setTypingStatus(
  userId: string,
  conversationId: number,
  isTyping: boolean,
  userName: string | null
): Promise<TypingUser | null> {
  await assertParticipant(conversationId, userId)

  if (isTyping) {
    await db.typingStatus.upsert({
      where: { conversationId_userId: { conversationId, userId } },
      create: { conversationId, userId, isTyping: true },
      update: { isTyping: true, updatedAt: new Date() },
    })
    emitTypingStart(conversationId, { userId, name: userName })
    return { userId, name: userName }
  }

  await db.typingStatus.deleteMany({ where: { conversationId, userId } })
  emitTypingStop(conversationId, userId)
  return null
}

export async function getConversationAttachments(conversationId: number, userId: string) {
  await assertParticipant(conversationId, userId)

  const attachments = await db.chatAttachment.findMany({
    where: { message: { conversationId, isDeleted: false } },
    orderBy: { createdAt: "desc" },
  })

  return attachments.map((a) => ({
    id: a.id,
    fileName: a.fileName,
    fileUrl: a.fileUrl,
    mimeType: a.mimeType,
    sizeBytes: a.sizeBytes,
    type: a.type,
    thumbnailUrl: a.thumbnailUrl,
    createdAt: a.createdAt.toISOString(),
  }))
}

export async function listAvailableUsers(currentUserId: string) {
  const users = await db.user.findMany({
    where: { active: true, id: { not: currentUserId } },
    orderBy: { name: "asc" },
    select: { id: true, name: true, email: true, image: true, role: true },
  })

  const online = onlineSet()
  return users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    image: u.image,
    role: u.role,
    isOnline: online.has(u.id),
    jobTitle: resolveJobTitle(u.role),
  }))
}
