import type {
  Conversation,
  ConversationParticipant,
  Message,
  User,
} from "@/generated/prisma/client"
import type { ConversationDTO, ConversationParticipantDTO } from "./types"
import { toChatUser } from "./message-dto"

type ConversationWithRelations = Conversation & {
  participants: Array<ConversationParticipant & { user: User }>
  messages: Array<
    Pick<Message, "id" | "content" | "senderId" | "createdAt" | "isDeleted">
  >
}

export function toParticipantDTO(
  p: ConversationParticipant & { user: User },
  onlineUserIds?: Set<string>
): ConversationParticipantDTO {
  return {
    userId: p.userId,
    user: toChatUser(p.user, onlineUserIds?.has(p.userId)),
    category: p.category,
    isFavorite: p.isFavorite,
    isMuted: p.isMuted,
    isArchived: p.isArchived,
    unreadCount: p.unreadCount,
    lastReadAt: p.lastReadAt?.toISOString() ?? null,
  }
}

export function toConversationDTO(
  conv: ConversationWithRelations,
  currentUserId: string,
  onlineUserIds?: Set<string>
): ConversationDTO {
  const myParticipant = conv.participants.find((p) => p.userId === currentUserId)
  const others = conv.participants.filter((p) => p.userId !== currentUserId)
  const lastMsg = conv.messages[0] ?? null

  return {
    id: conv.id,
    title: conv.title,
    type: conv.type,
    category: myParticipant?.category ?? null,
    isFavorite: myParticipant?.isFavorite ?? false,
    isMuted: myParticipant?.isMuted ?? false,
    isArchived: myParticipant?.isArchived ?? false,
    unreadCount: myParticipant?.unreadCount ?? 0,
    lastMessageAt: conv.lastMessageAt?.toISOString() ?? null,
    lastMessage: lastMsg
      ? {
          id: lastMsg.id,
          content: lastMsg.isDeleted ? null : lastMsg.content,
          senderId: lastMsg.senderId,
          createdAt: lastMsg.createdAt.toISOString(),
          isDeleted: lastMsg.isDeleted,
        }
      : null,
    participants: conv.participants.map((p) => toParticipantDTO(p, onlineUserIds)),
    otherParticipant: others[0] ? toChatUser(others[0].user, onlineUserIds?.has(others[0].userId)) : null,
    createdAt: conv.createdAt.toISOString(),
    updatedAt: conv.updatedAt.toISOString(),
  }
}
